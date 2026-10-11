package com.tastybites.billing.ui.billing

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CenterAlignedTopAppBar
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tastybites.billing.ui.components.OrderTypeSelector
import com.tastybites.billing.ui.theme.AppShapes
import com.tastybites.billing.ui.theme.PrimaryGreen
import com.tastybites.billing.viewmodel.BillingViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartPreviewScreen(
    viewModel: BillingViewModel,
    onBack: () -> Unit
) {
    val cartItems by viewModel.cartItems.collectAsState()
    val totalPrice = viewModel.getTotalPrice()
    var orderType by remember { mutableStateOf("Dine In") }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Cart Preview") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        bottomBar = {
            Column(modifier = Modifier.padding(16.dp)) {
                Divider(color = com.tastybites.billing.ui.theme.Borders)
                Spacer(modifier = Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Subtotal", style = MaterialTheme.typography.titleLarge)
                    Text("₹${totalPrice.toInt()}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                }
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = { /* Phase 2: Generate Bill */ },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = AppShapes.medium,
                    colors = ButtonDefaults.buttonColors(containerColor = PrimaryGreen),
                    enabled = cartItems.isNotEmpty()
                ) {
                    Text("GENERATE BILL", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 16.dp)
        ) {
            OrderTypeSelector(
                selectedType = orderType,
                onTypeSelected = { orderType = it }
            )
            Spacer(modifier = Modifier.height(16.dp))
            
            if (cartItems.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Cart is empty", style = MaterialTheme.typography.titleMedium)
                }
            } else {
                LazyColumn {
                    items(cartItems) { cartItem ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(cartItem.menuItem.name, style = MaterialTheme.typography.titleMedium)
                                Text("₹${cartItem.menuItem.price.toInt()} × ${cartItem.quantity}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            
                            Row(
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                IconButton(
                                    onClick = { viewModel.decreaseQuantity(cartItem.menuItem) },
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(PrimaryGreen.copy(alpha = 0.1f), AppShapes.small)
                                ) {
                                    Icon(Icons.Default.Remove, contentDescription = "Decrease", tint = PrimaryGreen)
                                }
                                Text(
                                    text = cartItem.quantity.toString(),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.width(32.dp),
                                    textAlign = TextAlign.Center
                                )
                                IconButton(
                                    onClick = { viewModel.addToCart(cartItem.menuItem) },
                                    modifier = Modifier
                                        .size(32.dp)
                                        .background(PrimaryGreen, AppShapes.small)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Increase", tint = MaterialTheme.colorScheme.onPrimary)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
