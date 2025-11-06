// api.js - Handles all API calls (namespaced under window.api)

// Register User
async function apiRegisterUser(userData) {
    try {
        const response = await fetch('api/register.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        // handle non-JSON or non-OK status gracefully
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('register: unexpected response', response.status, text);
            return { success: false, message: `Server returned ${response.status}: ${text}` };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Registration failed: network error' };
    }
}

// Login User
async function apiLoginUser(credentials) {
    try {
        const response = await fetch('api/login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('login: unexpected response', response.status, text);
            return { success: false, message: `Server returned ${response.status}: ${text}` };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'Login failed: network error' };
    }
}

// Get Products
async function apiGetProducts() {
    try {
        const response = await fetch('/api/products.php');
        const text = await response.text();
        try {
            const data = JSON.parse(text);
            return data.success ? data.products : [];
        } catch (e) {
            console.error('products: unexpected response', response.status, text);
            return [];
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function apiAddProduct(productData) {
    try {
        const response = await fetch('/api/products.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('addProduct: unexpected response', response.status, text);
            return { success: false, message: `Server returned ${response.status}: ${text}` };
        }
    } catch (error) {
        console.error('Error adding product:', error);
        return { success: false, message: 'Failed to add product: network error' };
    }
}

// Expose a small namespace to avoid global name collisions with other scripts
window.api = {
    registerUser: apiRegisterUser,
    loginUser: apiLoginUser,
    getProducts: apiGetProducts,
    addProduct: apiAddProduct
};

// Delete product by id (requires sellerId for simple authorization)
async function apiDeleteProduct(id, sellerId) {
    try {
        const response = await fetch('/api/delete_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, seller_id: sellerId })
        });
        return await response.json();
    } catch (error) {
        console.error('Error deleting product:', error);
        return { success: false, message: 'Failed to delete product' };
    }
}

// Send contact message to server
async function apiSendContact(contactData) {
    try {
        const response = await fetch('/api/contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(contactData)
        });
        return await response.json();
    } catch (error) {
        console.error('Error sending contact message:', error);
        return { success: false, message: 'Failed to send message' };
    }
}

// extend namespace
window.api.deleteProduct = apiDeleteProduct;
window.api.sendContact = apiSendContact;