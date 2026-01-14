/**
 * Gallery Management Functionality
 * Handles adding, displaying, and deleting gallery items
 */

class GalleryManager {
  constructor() {
    this.galleryItems = [];
    this.initElements();
    this.initEventListeners();
    this.loadGalleryItems();
  }

  /**
   * Initialize DOM elements
   */
  initElements() {
    // Form elements
    this.imageUrlInput = document.getElementById('galleryImageUrl');
    this.imageUploadInput = document.getElementById('galleryImageUpload');
    this.imagePreview = document.getElementById('imagePreview');
    this.titleInput = document.getElementById('galleryTitle');
    this.descriptionInput = document.getElementById('galleryDescription');
    this.categorySelect = document.getElementById('galleryCategory');
    this.addButton = document.getElementById('addGalleryItem');
    
    // Gallery items list
    this.galleryItemsList = document.getElementById('galleryItemsList');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Image URL input change
    this.imageUrlInput.addEventListener('input', () => {
      this.updateImagePreview(this.imageUrlInput.value);
    });
    
    // Image upload
    this.imageUploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
          const imageUrl = event.target.result;
          this.imageUrlInput.value = imageUrl;
          this.updateImagePreview(imageUrl);
        };
        
        reader.readAsDataURL(e.target.files[0]);
      }
    });
    
    // Add gallery item
    this.addButton.addEventListener('click', () => {
      this.addGalleryItem();
    });
  }

  /**
   * Update image preview
   * @param {string} url - The image URL
   */
  updateImagePreview(url) {
    if (url) {
      if (!this.imagePreview.querySelector('img')) {
        const img = document.createElement('img');
        this.imagePreview.appendChild(img);
      }
      
      const img = this.imagePreview.querySelector('img');
      img.src = url;
      this.imagePreview.classList.add('active');
    } else {
      this.imagePreview.innerHTML = '';
      this.imagePreview.classList.remove('active');
    }
  }

  /**
   * Add a new gallery item
   */
  addGalleryItem() {
    const imageUrl = this.imageUrlInput.value;
    const title = this.titleInput.value;
    const description = this.descriptionInput.value;
    const category = this.categorySelect.value;
    
    // Validate inputs
    if (!imageUrl || !title || !description || !category) {
      this.showNotification('Please fill in all fields', 'error');
      return;
    }
    
    // Create new gallery item
    const newItem = {
      id: Date.now().toString(),
      imageUrl,
      title,
      description,
      category,
      date: new Date().toISOString()
    };
    
    // Add to gallery items
    this.galleryItems.push(newItem);
    
    // Save to localStorage
    this.saveGalleryItems();
    
    // Render gallery items
    this.renderGalleryItems();
    
    // Clear form
    this.clearForm();
    
    // Show success notification
    this.showNotification('Gallery item added successfully', 'success');
  }

  /**
   * Delete a gallery item
   * @param {string} id - The ID of the gallery item to delete
   */
  deleteGalleryItem(id) {
    // Filter out the item with the given ID
    this.galleryItems = this.galleryItems.filter(item => item.id !== id);
    
    // Save to localStorage
    this.saveGalleryItems();
    
    // Render gallery items
    this.renderGalleryItems();
    
    // Show success notification
    this.showNotification('Gallery item deleted successfully', 'success');
  }

  /**
   * Render gallery items
   */
  renderGalleryItems() {
    // Clear gallery items list
    this.galleryItemsList.innerHTML = '';
    
    // If no items, show empty message
    if (this.galleryItems.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.textContent = 'No gallery items found.';
      this.galleryItemsList.appendChild(emptyMessage);
      return;
    }
    
    // Render each gallery item
    this.galleryItems.forEach(item => {
      const itemElement = this.createGalleryItemElement(item);
      this.galleryItemsList.appendChild(itemElement);
    });
  }

  /**
   * Create a gallery item element
   * @param {Object} item - The gallery item
   * @returns {HTMLElement} - The gallery item element
   */
  createGalleryItemElement(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'gallery-item-card';
    itemElement.dataset.id = item.id;
    
    // Image
    const imageElement = document.createElement('div');
    imageElement.className = 'gallery-item-image';
    const img = document.createElement('img');
    img.src = item.imageUrl;
    img.alt = item.title;
    imageElement.appendChild(img);
    
    // Info
    const infoElement = document.createElement('div');
    infoElement.className = 'gallery-item-info';
    const titleElement = document.createElement('h4');
    titleElement.textContent = item.title;
    const descriptionElement = document.createElement('p');
    descriptionElement.textContent = item.description;
    infoElement.appendChild(titleElement);
    infoElement.appendChild(descriptionElement);
    
    // Actions
    const actionsElement = document.createElement('div');
    actionsElement.className = 'gallery-item-actions';
    const categoryElement = document.createElement('span');
    categoryElement.className = 'gallery-item-category';
    categoryElement.textContent = this.getCategoryLabel(item.category);
    const deleteButton = document.createElement('button');
    deleteButton.className = 'gallery-item-delete';
    deleteButton.innerHTML = '<ion-icon name="trash-outline"></ion-icon>';
    deleteButton.addEventListener('click', () => {
      this.deleteGalleryItem(item.id);
    });
    actionsElement.appendChild(categoryElement);
    actionsElement.appendChild(deleteButton);
    
    // Append all elements
    itemElement.appendChild(imageElement);
    itemElement.appendChild(infoElement);
    itemElement.appendChild(actionsElement);
    
    return itemElement;
  }

  /**
   * Get category label
   * @param {string} category - The category value
   * @returns {string} - The category label
   */
  getCategoryLabel(category) {
    const categories = {
      events: 'Events',
      builds: 'Builds',
      players: 'Players',
      seasons: 'Past Seasons'
    };
    
    return categories[category] || category;
  }

  /**
   * Clear form
   */
  clearForm() {
    this.imageUrlInput.value = '';
    this.imageUploadInput.value = '';
    this.titleInput.value = '';
    this.descriptionInput.value = '';
    this.categorySelect.selectedIndex = 0;
    this.imagePreview.innerHTML = '';
    this.imagePreview.classList.remove('active');
  }

  /**
   * Load gallery items from localStorage
   */
  loadGalleryItems() {
    const storedItems = localStorage.getItem('galleryItems');
    
    if (storedItems) {
      try {
        this.galleryItems = JSON.parse(storedItems);
        this.renderGalleryItems();
      } catch (error) {
        console.error('Error loading gallery items:', error);
        this.galleryItems = [];
      }
    }
  }

  /**
   * Save gallery items to localStorage
   */
  saveGalleryItems() {
    localStorage.setItem('galleryItems', JSON.stringify(this.galleryItems));
  }

  /**
   * Show notification
   * @param {string} message - The notification message
   * @param {string} type - The notification type (success, error)
   */
  showNotification(message, type = 'success') {
    // Check if notification container exists
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      
      setTimeout(() => {
        notification.remove();
        
        // Remove container if empty
        if (notificationContainer.children.length === 0) {
          notificationContainer.remove();
        }
      }, 300);
    }, 3000);
  }
}

// Initialize gallery manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if admin is logged in
  const adminMain = document.getElementById('adminMain');
  
  if (adminMain && window.getComputedStyle(adminMain).display !== 'none') {
    // Admin is logged in, initialize gallery manager
    window.galleryManager = new GalleryManager();
  } else {
    // Wait for admin login
    const loginBtn = document.getElementById('loginBtn');
    
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        // Check if admin is logged in after login button click
        setTimeout(() => {
          if (adminMain && window.getComputedStyle(adminMain).display !== 'none') {
            // Admin is logged in, initialize gallery manager
            window.galleryManager = new GalleryManager();
          }
        }, 500);
      });
    }
  }
});