package com.tastybites.billing.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import com.tastybites.billing.navigation.Screen
import com.tastybites.billing.ui.theme.AccentOrange
import com.tastybites.billing.ui.theme.PrimaryGreen

@Composable
fun AppBottomNavigation(
    currentRoute: String?,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem("Billing", Screen.Billing.route, Icons.Default.ShoppingCart),
        BottomNavItem("History", Screen.History.route, Icons.Default.List),
        BottomNavItem("Sales", Screen.Sales.route, Icons.Default.Receipt),
        BottomNavItem("More", Screen.More.route, Icons.Default.Menu)
    )

    NavigationBar(
        containerColor = com.tastybites.billing.ui.theme.Surface
    ) {
        items.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.title) },
                label = { Text(item.title) },
                selected = currentRoute == item.route,
                onClick = {
                    if (currentRoute != item.route) {
                        onNavigate(item.route)
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryGreen,
                    unselectedIconColor = com.tastybites.billing.ui.theme.SecondaryText,
                    selectedTextColor = PrimaryGreen,
                    unselectedTextColor = com.tastybites.billing.ui.theme.SecondaryText,
                    indicatorColor = AccentOrange.copy(alpha = 0.2f)
                )
            )
        }
    }
}

data class BottomNavItem(val title: String, val route: String, val icon: ImageVector)
