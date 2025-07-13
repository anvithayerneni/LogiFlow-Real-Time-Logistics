output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "aks_cluster_name" {
  description = "The name of the AKS cluster"
  value       = module.aks.cluster_name
}

output "aks_kube_config" {
  description = "Kubeconfig for accessing the AKS cluster"
  value       = module.aks.kube_config
  sensitive   = true
}

output "postgresql_fqdn" {
  description = "Fully qualified domain name for PostgreSQL server"
  value       = module.postgresql.fqdn
}

output "redis_hostname" {
  description = "Hostname for Azure Cache for Redis"
  value       = module.redis.hostname
}

output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace ID"
  value       = module.monitoring.log_analytics_workspace_id
}
