package com.tastybites.billing.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Billing : Screen("billing")
    object History : Screen("history")
    object Sales : Screen("sales")
    object More : Screen("more")
    object CartPreview : Screen("cart_preview")
}
