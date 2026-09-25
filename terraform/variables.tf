variable "project_name" {
  description = "Name prefix for all resources"
  type        = string
  default     = "logiflow"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "location" {
  description = "Azure datacenter region"
  type        = string
  default     = "eastus2"
}

variable "aks_node_count" {
  description = "Number of worker nodes for the AKS cluster"
  type        = number
  default     = 3
}

variable "aks_vm_size" {
  description = "VM SKU for the AKS worker nodes"
  type        = string
  default     = "Standard_D4s_v5"
}

variable "db_admin_username" {
  description = "PostgreSQL Flexible Server Administrator username"
  type        = string
  default     = "psqladmin"
}

variable "db_admin_password" {
  description = "PostgreSQL Flexible Server Administrator password"
  type        = string
  sensitive   = true
  default     = "SuperSecureP@ssw0rd2026!"
}
