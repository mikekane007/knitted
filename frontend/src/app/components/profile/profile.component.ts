import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private eventService = inject(EventService);

  // States
  isLoadingProfile = true;
  isLoadingPasses = true;
  isSavingProfile = false;
  isEditing = false;
  
  // Model data
  userProfile: any = null;
  passes: any[] = [];
  
  // Edit Form Model
  editModel = {
    name: '',
    location: '',
    bio: '',
    avatarUrl: '',
    wovenThreads: ''
  };

  // Interest options for checkbox select
  allThreads = ['Art & Design', 'Food & Wine', 'Active & Outdoors', 'Indie Tech & Craft', 'Music & Sound'];
  selectedThreads: { [key: string]: boolean } = {};

  errorMessage = '';
  successMessage = '';

  // Printing state
  selectedPrintPass: any = null;

  ngOnInit(): void {
    this.loadProfile();
    this.loadPasses();
  }

  loadProfile(): void {
    this.isLoadingProfile = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.editModel = {
          name: profile.name || '',
          location: profile.location || '',
          bio: profile.bio || '',
          avatarUrl: profile.avatarUrl || '',
          wovenThreads: profile.wovenThreads || ''
        };
        
        // Populate selected threads
        const threads = (profile.wovenThreads || '').split(',').map((t: string) => t.trim());
        this.allThreads.forEach(thread => {
          this.selectedThreads[thread] = threads.includes(thread);
        });

        this.isLoadingProfile = false;
      },
      error: () => {
        this.isLoadingProfile = false;
      }
    });
  }

  loadPasses(): void {
    this.isLoadingPasses = true;
    this.eventService.getMyPasses().subscribe({
      next: (passes) => {
        this.passes = passes;
        this.isLoadingPasses = false;
      },
      error: () => {
        this.isLoadingPasses = false;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
  }

  onSave(): void {
    this.isSavingProfile = true;
    this.successMessage = '';
    this.errorMessage = '';

    const threads = Object.keys(this.selectedThreads)
      .filter(k => this.selectedThreads[k])
      .join(', ');

    const payload = {
      ...this.editModel,
      wovenThreads: threads
    };

    this.authService.updateProfile(payload).subscribe({
      next: (updatedProfile) => {
        this.userProfile = updatedProfile;
        this.isSavingProfile = false;
        this.isEditing = false;
        this.successMessage = 'Profile successfully updated!';
        
        localStorage.setItem('knitted_user_profile', JSON.stringify({
          fullName: updatedProfile.name,
          city: updatedProfile.location,
          bio: updatedProfile.bio,
          onboarded: true
        }));
      },
      error: (err) => {
        this.isSavingProfile = false;
        this.errorMessage = err.error || 'Failed to update profile.';
      }
    });
  }

  printPass(pass: any): void {
    this.selectedPrintPass = pass;
    setTimeout(() => {
      window.print();
    }, 150);
  }
}
