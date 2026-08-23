# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["Knitted.Api/Knitted.Api.csproj", "Knitted.Api/"]
RUN dotnet restore "Knitted.Api/Knitted.Api.csproj"

# Copy all source files and build
COPY . .
WORKDIR "/src/Knitted.Api"
RUN dotnet build "Knitted.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "Knitted.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Knitted.Api.dll"]
