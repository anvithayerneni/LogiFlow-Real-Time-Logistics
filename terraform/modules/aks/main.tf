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
  description = "Subnet ID for the AKS cluster nodes"
}

variable "node_count" {
  type        = number
  description = "Desired number of Kubernetes worker nodes"
}

variable "vm_size" {
  type        = string
  description = "Azure VM SKU for worker nodes"
}

variable "log_analytics_workspace_id" {
  type        = string
  description = "Log Analytics Workspace resource ID for container monitoring"
}

resource "azurerm_kubernetes_cluster" "aks" {
  name                = "${var.project_name}-${var.environment}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = "${var.project_name}-${var.environment}-dns"

  default_node_pool {
    name                = "default"
    node_count          = var.node_count
    vm_size             = var.vm_size
    vnet_subnet_id      = var.subnet_id
    enable_auto_scaling = true
    min_count           = 2
    max_count           = 5
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "azure"
    load_balancer_sku = "standard"
  }

  oms_agent {
    log_analytics_workspace_id = var.log_analytics_workspace_id
  }

  tags = {
    Environment = var.environment
    Project     = var.project_name
    Component   = "Kubernetes"
  }
}

output "cluster_name" {
  description = "Name of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.name
}

output "cluster_id" {
  description = "Resource ID of the AKS cluster"
  value       = azurerm_kubernetes_cluster.aks.id
}

output "kube_config" {
  description = "Raw kubeconfig data for connecting to the cluster"
  value       = azurerm_kubernetes_cluster.aks.kube_config_raw
  sensitive   = true
}

output "oidc_issuer_url" {
  description = "OIDC issuer URL for Workload Identity integration"
  value       = azurerm_kubernetes_cluster.aks.oidc_issuer_url
}
