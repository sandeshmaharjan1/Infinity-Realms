/**
 * Gallery Filtering and Animation
 * Handles the filtering of gallery items based on category
 * and adds smooth animations for transitions
 */

document.addEventListener('DOMContentLoaded', () => {
  // Get all filter buttons and gallery items
  const filterButtons = document.querySelectorAll('.gallery-filters .filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  
  // Add click event listeners to filter buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Get the filter value
      const filterValue = button.getAttribute('data-filter');
      
      // Filter gallery items
      filterGalleryItems(filterValue);
    });
  });
  
  /**
   * Filter gallery items based on category
   * @param {string} filter - The category to filter by
   */
  function filterGalleryItems(filter) {
    galleryItems.forEach(item => {
      // Get the item's category
      const category = item.getAttribute('data-category');
      
      // Reset animations
      item.style.animation = 'none';
      item.offsetHeight; // Trigger reflow
      
      // Show all items if filter is 'all', otherwise filter by category
      if (filter === 'all' || category === filter) {
        item.style.display = 'block';
        // Add animation with random delay for staggered effect
        const delay = Math.random() * 0.3;
        item.style.animation = `fadeInUp 0.5s ease-out ${delay}s forwards`;
      } else {
        // Hide items that don't match the filter
        item.style.display = 'none';
      }
    });
  }
  
  // Initialize Masonry layout after images are loaded
  function initMasonry() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    // Wait for all images to load
    const images = galleryGrid.querySelectorAll('img');
    let loadedImages = 0;
    
    images.forEach(img => {
      if (img.complete) {
        loadedImages++;
      } else {
        img.addEventListener('load', () => {
          loadedImages++;
          if (loadedImages === images.length) {
            // All images loaded, apply masonry layout
            applyMasonryLayout();
          }
        });
      }
    });
    
    // If all images were already loaded
    if (loadedImages === images.length) {
      applyMasonryLayout();
    }
  }
  
  /**
   * Apply masonry layout to gallery grid
   * This creates a more dynamic and visually appealing grid
   */
  function applyMasonryLayout() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    // Get all visible items
    const visibleItems = Array.from(galleryItems).filter(
      item => item.style.display !== 'none'
    );
    
    // Apply different heights to create masonry effect
    visibleItems.forEach((item, index) => {
      if (index % 3 === 0) {
        item.style.gridRow = 'span 1';
      } else if (index % 3 === 1) {
        item.style.gridRow = 'span 1';
      } else {
        item.style.gridRow = 'span 1';
      }
    });
  }
  
  // Initialize gallery
  initMasonry();
  
  // Add lightbox functionality for gallery items
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      // Get image source and description
      const imgSrc = item.querySelector('img').src;
      const title = item.querySelector('h3').textContent;
      const desc = item.querySelector('p').textContent;
      
      // Create lightbox
      createLightbox(imgSrc, title, desc);
    });
  });
  
  /**
   * Create a lightbox to display the gallery image
   * @param {string} imgSrc - The source of the image
   * @param {string} title - The title of the image
   * @param {string} desc - The description of the image
   */
  function createLightbox(imgSrc, title, desc) {
    // Create lightbox elements
    const lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';
    
    // Create image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'lightbox-content';
    
    // Create image
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = title;
    
    // Create caption
    const caption = document.createElement('div');
    caption.className = 'lightbox-caption';
    caption.innerHTML = `<h3>${title}</h3><p>${desc}</p>`;
    
    // Append elements
    imgContainer.appendChild(img);
    lightbox.appendChild(closeBtn);
    lightbox.appendChild(imgContainer);
    lightbox.appendChild(caption);
    
    // Add lightbox to body
    document.body.appendChild(lightbox);
    
    // Prevent scrolling on body
    document.body.style.overflow = 'hidden';
    
    // Add animation
    setTimeout(() => {
      lightbox.classList.add('active');
    }, 10);
    
    // Close lightbox on click
    closeBtn.addEventListener('click', () => {
      lightbox.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(lightbox);
        document.body.style.overflow = '';
      }, 300);
    });
    
    // Close lightbox on background click
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
        setTimeout(() => {
          document.body.removeChild(lightbox);
          document.body.style.overflow = '';
        }, 300);
      }
    });
  }
});