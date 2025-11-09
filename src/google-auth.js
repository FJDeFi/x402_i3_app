// Google Authentication Management
import { 
  signInWithGoogle, 
  signOutUser, 
  onAuthStateChange, 
  getCurrentUser,
  getUserFromFirestore,
  updateUserCredits
} from './firebase-config.js';

class GoogleAuthManager {
  constructor() {
    this.currentUser = null;
    this.userData = null;
    this.init();
  }

  async init() {
    // Set up auth state listener
    onAuthStateChange(async (user) => {
      if (user) {
        console.log('User signed in:', user.email);
        this.currentUser = user;
        await this.loadUserData(user.uid);
        this.updateUIForSignedInUser();
      } else {
        console.log('User signed out');
        this.currentUser = null;
        this.userData = null;
        this.updateUIForSignedOutUser();
      }
    });
  }

  async loadUserData(uid) {
    try {
      this.userData = await getUserFromFirestore(uid);
      console.log('User data loaded:', this.userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async signIn() {
    try {
      const user = await signInWithGoogle();
      console.log('Successfully signed in with Google');
      return user;
    } catch (error) {
      console.error('Error during Google sign in:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await signOutUser();
      console.log('Successfully signed out');
    } catch (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
  }

  async handleDailyCheckin() {
    if (!this.currentUser || !this.userData) {
      console.error('No user logged in');
      return;
    }

    try {
      const newCredits = (this.userData.credits || 0) + 30;
      await updateUserCredits(this.currentUser.uid, newCredits);
      
      // Update local data
      this.userData.credits = newCredits;
      
      // Update UI
      this.updateCreditsDisplay(newCredits);
      
      // Show success message
      this.showCheckinSuccess();
      
      console.log('Daily check-in successful, credits updated to:', newCredits);
    } catch (error) {
      console.error('Error during daily check-in:', error);
      this.showCheckinError();
    }
  }

  updateUIForSignedInUser() {
    const accountBtn = document.getElementById('accountBtn');
    const accountBtnText = document.getElementById('accountBtnText');
    const creditsDisplay = document.getElementById('creditsDisplay');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const logoutBtn = document.querySelector('.dropdown-item[href="#"]:last-child');

    if (accountBtnText && this.userData) {
      accountBtnText.textContent = this.userData.displayName || this.currentUser.email;
    }

    if (creditsDisplay && this.userData) {
      creditsDisplay.textContent = `${this.userData.credits || 0} Credits`;
    }

    if (googleSignInBtn) {
      googleSignInBtn.style.display = 'none';
    }

    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        this.signOut();
      };
    }

    // Update wallet section visibility
    const walletSection = document.getElementById('walletSection');
    if (walletSection) {
      walletSection.style.display = 'block';
    }
  }

  updateUIForSignedOutUser() {
    const accountBtnText = document.getElementById('accountBtnText');
    const creditsDisplay = document.getElementById('creditsDisplay');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const logoutBtn = document.querySelector('.dropdown-item[href="#"]:last-child');

    if (accountBtnText) {
      accountBtnText.textContent = 'My Account';
    }

    if (creditsDisplay) {
      creditsDisplay.textContent = '0 Credits';
    }

    if (googleSignInBtn) {
      googleSignInBtn.style.display = 'block';
    }

    if (logoutBtn) {
      logoutBtn.onclick = null;
    }

    // Hide wallet section when not logged in
    const walletSection = document.getElementById('walletSection');
    if (walletSection) {
      walletSection.style.display = 'none';
    }
  }

  updateCreditsDisplay(credits) {
    const creditsDisplay = document.getElementById('creditsDisplay');
    if (creditsDisplay) {
      creditsDisplay.textContent = `${credits} Credits`;
    }
  }

  showCheckinSuccess() {
    // Create and show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = '✅ Daily check-in successful! +30 Credits';
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  showCheckinError() {
    // Create and show error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ef4444;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.textContent = '❌ Check-in failed. Please try again.';
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getUserData() {
    return this.userData;
  }

  isSignedIn() {
    return !!this.currentUser;
  }
}

// Create global instance
const googleAuthManager = new GoogleAuthManager();

// Export functions for global use
window.googleAuthManager = googleAuthManager;
window.handleGoogleSignIn = () => googleAuthManager.signIn();
window.handleDailyCheckin = () => googleAuthManager.handleDailyCheckin();

export default googleAuthManager; 