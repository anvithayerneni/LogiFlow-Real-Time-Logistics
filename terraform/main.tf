terraform {
  required_version = ">= 1.5.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. Resource Group
resource "azurerm_resource_group" "rg" {
  name     = "${var.project_name}-${var.environment}-rg"
  location = var.location
  tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
  }
}

# 2. Networking Module
module "vnet" {
  source              = "./modules/vnet"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  project_name        = var.project_name
  environment         = var.environment
}

# 3. Observability & Monitoring Module
module "monitoring" {
  source              = "./modules/monitoring"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  project_name        = var.project_name
  environment         = var.environment
}

# 4. Azure Database for PostgreSQL Flexible Server
module "postgresql" {
  source              = "./modules/postgresql"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  project_name        = var.project_name
  environment         = var.environment
  subnet_id           = module.vnet.db_subnet_id
  admin_username      = var.db_admin_username
  admin_password      = var.db_admin_password
}

# 5. Azure Cache for Redis
module "redis" {
  source              = "./modules/redis"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  project_name        = var.project_name
  environment         = var.environment
  subnet_id           = module.vnet.redis_subnet_id
}

# 6. Azure Kubernetes Service (AKS)
module "aks" {
  source                 = "./modules/aks"
  resource_group_name    = azurerm_resource_group.rg.name
  location               = azurerm_resource_group.rg.location
  project_name           = var.project_name
  environment            = var.environment
  subnet_id              = module.vnet.aks_subnet_id
  node_count             = var.aks_node_count
  vm_size                = var.aks_vm_size
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id
}
