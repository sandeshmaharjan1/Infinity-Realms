// Enhanced dynamic animations for shop items - simple reveal for all cards
document.addEventListener('DOMContentLoaded', () => {
    // Reveal all product cards immediately with staggered animation
    document.querySelectorAll('.product-card, .shop-item').forEach((card, index) => {
        // Set initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        // Reveal with stagger delay
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });

    // Enhanced filter button animations
    document.querySelectorAll('.filter-btn, .category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn, .category-btn').forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Simple ripple effect
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255,255,255,0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.marginLeft = '-10px';
            ripple.style.marginTop = '-10px';
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);

            // Add loading state to products grid
            const productsGrid = document.querySelector('.products-grid');
            if (productsGrid) {
                productsGrid.style.filter = 'blur(1px)';
                setTimeout(() => {
                    productsGrid.style.filter = 'none';
                }, 300);
            }
        });
    });

    // Enhanced cart counter animation
    function updateCartCounter(count) {
        const counter = document.querySelector('.cart-count');
        if (!counter) return;

        counter.style.animation = 'none';
        counter.offsetHeight; // Trigger reflow
        counter.style.animation = 'scaleInBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        counter.textContent = count;
    }


    // Enhanced filter button animations
    document.querySelectorAll('.filter-btn, .category-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            // Remove active class from all buttons
            document.querySelectorAll('.filter-btn, .category-btn').forEach(b => b.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Simple ripple effect
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(99, 102, 241, 0.3)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = (e.offsetX - 10) + 'px';
            ripple.style.top = (e.offsetY - 10) + 'px';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.pointerEvents = 'none';

            this.style.position = 'relative';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);

            // Add loading state to products grid
            const productsGrid = document.querySelector('.products-grid');
            if (productsGrid) {
                productsGrid.style.filter = 'blur(1px)';
                setTimeout(() => {
                    productsGrid.style.filter = 'none';
                }, 300);
            }
        });
    });

    // Enhanced cart counter animation
    function updateCartCounter(count) {
        const counter = document.querySelector('.cart-count');
        if (!counter) return;

        counter.style.animation = 'none';
        counter.offsetHeight; // Trigger reflow
        counter.style.animation = 'scaleInBounce 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        counter.textContent = count;
    }

    // Smooth cart open/close
    const cartBtn = document.querySelector('.cart-btn');
    const cartSidebar = document.querySelector('.cart-sidebar');
    const shopContainer = document.querySelector('.shop-container');

    cartBtn?.addEventListener('click', () => {
        const isActive = cartSidebar.classList.contains('active');
        if (isActive) {
            cartSidebar.classList.remove('active');
            shopContainer.classList.remove('cart-open');
            document.querySelector('.shop-content-wrapper')?.style.filter = 'none';
        } else {
            cartSidebar.classList.add('active');
            shopContainer.classList.add('cart-open');
            // Add subtle blur effect to main content when cart is open
            document.querySelector('.shop-content-wrapper')?.style.filter = 'blur(1px)';
        }
    });

    // Floating animation for badges
    const badges = document.querySelectorAll('.product-badge');
    badges.forEach(badge => {
        badge.style.animation = 'float 3s ease-in-out infinite';
    });
});
