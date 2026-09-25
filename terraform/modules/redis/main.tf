variable "resource_group_name" {
  type        = string
  description = "Name of the resource group"
}

variable "location" {
  type        = string
  description = "Azure region for deployment"
}

variable "project_name" {
  type        = string
  description = "Base project name"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "subnet_id" {
  type        = string
  description = "Subnet ID for Redis cache (optional for basic/standard tier)"
  default     = null
}

resource "azurerm_redis_cache" "redis" {
  name                = "${var.project_name}-${var.environment}-redis"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_reserved = 50
    maxmemory_delta    = 50
    maxmemory_policy   = "allkeys-lru"
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "Cache"
  }
}

output "hostname" {
  description = "Hostname of the Redis cache"
  value       = azurerm_redis_cache.redis.hostname
}

output "ssl_port" {
  description = "SSL port of the Redis cache"
  value       = azurerm_redis_cache.redis.ssl_port
}

output "primary_access_key" {
  description = "Primary access key for Redis authentication"
  value       = azurerm_redis_cache.redis.primary_access_key
  sensitive   = true
}
