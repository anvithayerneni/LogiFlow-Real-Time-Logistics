variable "resource_group_name" { type = string }
variable "location" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }
variable "subnet_id" { type = string }
variable "admin_username" { type = string }
variable "admin_password" { type = string }

resource "azurerm_postgresql_flexible_server" "psql" {
  name                   = "${var.project_name}-${var.environment}-psql"
  resource_group_name    = var.resource_group_name
  location               = var.location
  version                = "16"
  delegated_subnet_id    = var.subnet_id
  administrator_login    = var.admin_username
  administrator_password = var.admin_password

  storage_mb = 32768
  sku_name   = "GP_Standard_D2ds_v5"

  backup_retention_days = 7
  zone                  = "1"
}

resource "azurerm_postgresql_flexible_server_database" "db" {
  name      = "delivery_db"
  server_id = azurerm_postgresql_flexible_server.psql.id
  collation = "en_US.utf8"
  charset   = "utf8"
}

output "fqdn" { value = azurerm_postgresql_flexible_server.psql.fqdn }
output "server_id" { value = azurerm_postgresql_flexible_server.psql.id }
