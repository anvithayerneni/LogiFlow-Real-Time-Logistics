variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }

resource "azurerm_log_analytics_workspace" "law" {
  name                = "${var.project_name}-${var.environment}-law"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

output "log_analytics_workspace_id" { value = azurerm_log_analytics_workspace.law.id }
