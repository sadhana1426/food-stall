package com.tastybites.billing.viewmodel

import androidx.lifecycle.ViewModel
import com.tastybites.billing.data.model.CartItem
import com.tastybites.billing.data.model.MenuItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class BillingViewModel : ViewModel() {

    private val allItems = listOf(
        MenuItem("1", "Samosa", 15.0, "Snacks"),
        MenuItem("2", "Vada Pav", 30.0, "Snacks"),
        MenuItem("3", "Masala Dosa", 60.0, "Meals"),
        MenuItem("4", "Idli", 40.0, "Meals"),
        MenuItem("5", "Tea", 10.0, "Beverages"),
        MenuItem("6", "Coffee", 20.0, "Beverages")
    )

    private val _menuItems = MutableStateFlow(allItems)
    val menuItems: StateFlow<List<MenuItem>> = _menuItems.asStateFlow()

    private val _cartItems = MutableStateFlow<List<CartItem>>(emptyList())
    val cartItems: StateFlow<List<CartItem>> = _cartItems.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow("All")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    val categories = listOf("All", "Snacks", "Meals", "Beverages")

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
        filterItems()
    }

    fun onCategorySelected(category: String) {
        _selectedCategory.value = category
        filterItems()
    }

    private fun filterItems() {
        val query = _searchQuery.value
        val category = _selectedCategory.value

        _menuItems.value = allItems.filter {
            (category == "All" || it.category == category) &&
            (query.isEmpty() || it.name.contains(query, ignoreCase = true))
        }
    }

    fun addToCart(item: MenuItem) {
        _cartItems.update { currentCart ->
            val existingItem = currentCart.find { it.menuItem.id == item.id }
            if (existingItem != null) {
                currentCart.map {
                    if (it.menuItem.id == item.id) it.copy(quantity = it.quantity + 1) else it
                }
            } else {
                currentCart + CartItem(item, 1)
            }
        }
    }

    fun decreaseQuantity(item: MenuItem) {
        _cartItems.update { currentCart ->
            val existingItem = currentCart.find { it.menuItem.id == item.id }
            if (existingItem != null) {
                if (existingItem.quantity > 1) {
                    currentCart.map {
                        if (it.menuItem.id == item.id) it.copy(quantity = it.quantity - 1) else it
                    }
                } else {
                    currentCart.filter { it.menuItem.id != item.id }
                }
            } else {
                currentCart
            }
        }
    }

    fun getQuantity(item: MenuItem): Int {
        return _cartItems.value.find { it.menuItem.id == item.id }?.quantity ?: 0
    }
    
    fun getTotalItems(): Int {
        return _cartItems.value.sumOf { it.quantity }
    }
    
    fun getTotalPrice(): Double {
        return _cartItems.value.sumOf { it.menuItem.price * it.quantity }
    }
}
