import { Info, Bug, AlertTriangle, XCircle, AlertOctagon } from "lucide-react";
import type { Project } from "~/lib/api";

// Utility to get user's role on a project
export function getUserRole(project: Project, userId: string | null): string | null {
    if (!userId) return null;
    const projectUser = project.users.find((u) => u.id === userId);
    return projectUser?.role || null;
}

// Check if user has permission for an action
export function hasPermission(role: string | null, action: 'delete_project' | 'create_api_key' | 'delete_api_key' | 'update_project' | 'create_alarm' | 'delete_alarm' | 'update_alarm' | 'delete_logs'): boolean {
    if (!role) return false;

    switch (action) {
        case 'delete_project':
            return role === 'admin';
        case 'create_api_key':
        case 'delete_api_key':
        case 'update_project':
        case 'create_alarm':
        case 'delete_alarm':
        case 'update_alarm':
        case 'delete_logs':
            return role === 'admin' || role === 'editor';
        default:
            return false;
    }
}

// Helper function to get the most severe log level from an array
export function getMostSevereLevel(levels: string[]): string {
    const severityOrder = ['CRITICAL', 'ERROR', 'WARNING', 'INFO', 'DEBUG'];
    for (const severity of severityOrder) {
        if (levels.some(level => level.toUpperCase() === severity)) {
            return severity;
        }
    }
    return levels[0] || 'INFO';
}

// Helper function to get log level styling
export function getLogLevelStyle(level: string | string[]): { icon: any; color: string; bgColor: string } {
    // If level is an array, use the most severe level for styling
    const levelString = Array.isArray(level) ? getMostSevereLevel(level) : level;
    const levelUpper = levelString.toUpperCase();

    switch (levelUpper) {
        case 'INFO':
            return {
                icon: Info,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100'
            };
        case 'DEBUG':
            return {
                icon: Bug,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100'
            };
        case 'WARNING':
            return {
                icon: AlertTriangle,
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-100'
            };
        case 'ERROR':
            return {
                icon: XCircle,
                color: 'text-red-600',
                bgColor: 'bg-red-100'
            };
        case 'CRITICAL':
            return {
                icon: AlertOctagon,
                color: 'text-red-800',
                bgColor: 'bg-red-200'
            };
        default:
            return {
                icon: Info,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100'
            };
    }
}

// Helper function to format large numbers
export function formatNumber(num: number): string {
    if (num < 1000) {
        return num.toString();
    } else if (num < 100000) {
        // Use commas for thousands up to 99,999
        return num.toLocaleString();
    } else if (num < 1000000) {
        // Use 'k' for hundreds of thousands
        const thousands = num / 1000;
        return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
    } else if (num < 1000000000) {
        // Use 'm' for millions
        const millions = num / 1000000;
        return millions % 1 === 0 ? `${millions}m` : `${millions.toFixed(1)}m`;
    } else {
        // Use 'b' for billions
        const billions = num / 1000000000;
        return billions % 1 === 0 ? `${billions}b` : `${billions.toFixed(1)}b`;
    }
}

// Helper function to generate pagination page numbers with ellipsis
export function getPageNumbers(currentPage: number, totalPages: number): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
        // Show all pages if total is less than max
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
    } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
            pages.push("ellipsis");
        }

        // Show pages around current page
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - 2) {
            pages.push("ellipsis");
        }

        // Always show last page
        pages.push(totalPages);
    }

    return pages;
}

