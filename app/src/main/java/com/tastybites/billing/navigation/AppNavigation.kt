package com.tastybites.billing.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.tastybites.billing.ui.billing.BillingScreen
import com.tastybites.billing.ui.billing.SplashScreen
import com.tastybites.billing.ui.components.AppBottomNavigation
import com.tastybites.billing.ui.history.HistoryScreen
import com.tastybites.billing.ui.more.MoreScreen
import com.tastybites.billing.ui.sales.SalesScreen
import com.tastybites.billing.ui.billing.CartPreviewScreen
import com.tastybites.billing.viewmodel.BillingViewModel

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val billingViewModel: BillingViewModel = viewModel()

    val showBottomNav = currentRoute in listOf(
        Screen.Billing.route,
        Screen.History.route,
        Screen.Sales.route,
        Screen.More.route
    )

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                AppBottomNavigation(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Splash.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Splash.route) {
                SplashScreen(onNavigateToBilling = {
                    navController.navigate(Screen.Billing.route) {
                        popUpTo(Screen.Splash.route) { inclusive = true }
                    }
                })
            }
            composable(Screen.Billing.route) {
                BillingScreen(
                    viewModel = billingViewModel,
                    onViewCart = {
                        navController.navigate(Screen.CartPreview.route)
                    }
                )
            }
            composable(Screen.History.route) {
                HistoryScreen()
            }
            composable(Screen.Sales.route) {
                SalesScreen()
            }
            composable(Screen.More.route) {
                MoreScreen()
            }
            composable(Screen.CartPreview.route) {
                CartPreviewScreen(
                    viewModel = billingViewModel,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
