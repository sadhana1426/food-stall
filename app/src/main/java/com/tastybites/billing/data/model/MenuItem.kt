package com.tastybites.billing.data.model

data class MenuItem(
    val id: String,
    val name: String,
    val price: Double,
    val category: String,
    val imageUrl: String? = null
)
