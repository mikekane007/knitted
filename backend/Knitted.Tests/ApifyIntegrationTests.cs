using System;
using System.IO;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Knitted.Api.Controllers;
using Knitted.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using NUnit.Framework;

namespace Knitted.Tests
{
    [TestFixture]
    public class ApifyIntegrationTests
    {
        private KnittedDbContext _context = null!;
        private EventsController _controller = null!;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<KnittedDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new KnittedDbContext(options);
            _context.Database.EnsureCreated();

            // Load secrets manually from User Secrets file to avoid transitive configuration dependency issues
            string? token = null;
            string homePath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string secretsPath = Path.Combine(homePath, ".microsoft", "usersecrets", "a0980c96-c3b4-4364-8fb6-495840beda15", "secrets.json");
            
            if (File.Exists(secretsPath))
            {
                try
                {
                    var secretsJson = File.ReadAllText(secretsPath);
                    using var doc = JsonDocument.Parse(secretsJson);
                    if (doc.RootElement.TryGetProperty("Apify:Token", out var tokenProp))
                    {
                        token = tokenProp.GetString();
                    }
                }
                catch
                {
                    // Ignore parsing issues
                }
            }

            // Fallback to environment variable
            token ??= Environment.GetEnvironmentVariable("APIFY_API_TOKEN");

            var inMemorySettings = new Dictionary<string, string> {
                {"Apify:Token", token ?? ""}
            };

            IConfiguration configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(inMemorySettings!)
                .Build();

            _controller = new EventsController(_context, configuration);
        }

        [TearDown]
        public void TearDown()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        [Test]
        [Category("Integration")]
        public async Task ScanExternal_WithValidToken_ShouldFetchAndSaveEvents()
        {
            // Check if token exists, skip test if not configured
            var token = Environment.GetEnvironmentVariable("APIFY_API_TOKEN");
            string homePath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            string secretsPath = Path.Combine(homePath, ".microsoft", "usersecrets", "a0980c96-c3b4-4364-8fb6-495840beda15", "secrets.json");
            if (string.IsNullOrEmpty(token) && !File.Exists(secretsPath))
            {
                Assert.Ignore("Apify Token is not configured. Skipping integration test.");
                return;
            }

            Console.WriteLine("Running live Apify integration test...");
            
            // Act
            var result = await _controller.ScanExternal();

            // Assert
            result.Result.Should().BeOfType<OkObjectResult>();
            var okResult = (OkObjectResult)result.Result!;
            
            var events = okResult.Value as IEnumerable<Knitted.Api.Models.Event>;
            events.Should().NotBeNull();
            
            var eventList = events!.ToList();
            Console.WriteLine($"Imported {eventList.Count} events successfully!");
            
            foreach (var evt in eventList)
            {
                Console.WriteLine($"- [{evt.Category}] {evt.Title} at {evt.Location} ({evt.StartTime} - {evt.EndTime})");
                evt.Title.Should().NotBeNullOrEmpty();
                evt.Location.Should().NotBeNullOrEmpty();
            }

            // Check db directly
            var dbEvents = await _context.Events.ToListAsync();
            dbEvents.Count.Should().BeGreaterThan(0);
        }
    }
}
