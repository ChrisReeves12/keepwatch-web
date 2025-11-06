import { useState, useEffect } from "react";
import { useSearchParams, useLoaderData } from "react-router";
import { FileText, Activity, Filter, RefreshCw, CheckCircle } from "lucide-react";
import moment from "moment";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody, DialogFooter } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Checkbox } from "~/components/ui/checkbox";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "~/components/ui/pagination";
import { AddAlarmForm } from "~/components/AddAlarmForm";
import { LogCard } from "../cards/LogCard";
import { formatNumber, getPageNumbers, getLogLevelStyle } from "../utils";
import { searchLogs, fetchEnvironments, type Project, type Log, type SearchLogsRequest, type Alarm, type EnvironmentOption } from "~/lib/api";
import type { loader } from "~/routes/project.$projectId";

export function ApplicationLogsTab({ project, canCreateAlarm, userEmail }: { project: Project; canCreateAlarm: boolean; userEmail?: string }) {
    const { token } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();

    const [logs, setLogs] = useState<Log[]>([]);
    const [searchInput, setSearchInput] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 50,
        total: 0,
        totalPages: 0,
    });

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCustomRange, setShowCustomRange] = useState(false);
    const [showAddAlarmModal, setShowAddAlarmModal] = useState(false);
    const [selectedLogForAlarm, setSelectedLogForAlarm] = useState<Log | null>(null);
    const [showAlarmSuccessModal, setShowAlarmSuccessModal] = useState(false);
    const [createdAlarmData, setCreatedAlarmData] = useState<Alarm | null>(null);
    const [availableEnvironments, setAvailableEnvironments] = useState<EnvironmentOption[]>([]);
    const [isLoadingEnvironments, setIsLoadingEnvironments] = useState(false);

    // Get filters from URL params (support arrays)
    const currentPage = parseInt(searchParams.get("page") || "1", 10);
    const levelFilters = searchParams.getAll("level");
    const environmentFilters = searchParams.getAll("environment");
    const hostnameFilters = searchParams.getAll("hostname");
    const searchQuery = searchParams.get("search") || "";
    const timeRange = searchParams.get("timeRange") || "";
    const customStartTime = searchParams.get("startTime") || "";
    const customEndTime = searchParams.get("endTime") || "";

    // Function to load environments (called on-demand when dropdown opens)
    const loadEnvironments = async () => {
        try {
            setIsLoadingEnvironments(true);
            const response = await fetchEnvironments(token, project.projectId, 'application');
            setAvailableEnvironments(response.environments);
        } catch (err) {
            console.error('Failed to fetch environments:', err);
        } finally {
            setIsLoadingEnvironments(false);
        }
    };

    // Sync search input with URL param on mount
    useEffect(() => {
        setSearchInput(searchQuery);
    }, [searchQuery]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== searchQuery) {
                const newParams = new URLSearchParams(searchParams);
                if (searchInput) {
                    newParams.set("search", searchInput);
                } else {
                    newParams.delete("search");
                }
                newParams.set("page", "1");
                setSearchParams(newParams);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchInput, searchQuery, searchParams, setSearchParams]);

    // Fetch logs (client-side with Bearer token)
    useEffect(() => {
        const fetchLogs = async () => {
            const hasExistingLogs = logs.length > 0;
            let refreshTimer: NodeJS.Timeout | null = null;

            // Only show initial loader if no logs exist
            if (!hasExistingLogs) {
                setIsInitialLoad(true);
            } else {
                // Delay showing refresh indicator to avoid flicker on fast requests
                refreshTimer = setTimeout(() => {
                    setIsRefreshing(true);
                }, 300); // Only show if request takes longer than 300ms
            }

            setError(null);

            try {
                // Build filters object
                const filters: SearchLogsRequest = {
                    page: currentPage,
                    pageSize: 50,
                    logType: "application",
                };

                // Add level filters if selected (send as array if multiple, string if single)
                if (levelFilters.length > 0) {
                    filters.level = levelFilters.length === 1 ? levelFilters[0] : levelFilters;
                }

                // Add environment filters if provided (send as array if multiple, string if single)
                if (environmentFilters.length > 0) {
                    filters.environment = environmentFilters.length === 1 ? environmentFilters[0] : environmentFilters;
                }

                // Add hostname filters if provided (send as array if multiple, string if single)
                if (hostnameFilters.length > 0) {
                    filters.hostname = hostnameFilters.length === 1 ? hostnameFilters[0] : hostnameFilters;
                }

                // Add document search filter if provided
                if (searchQuery) {
                    filters.docFilter = {
                        phrase: searchQuery,
                        matchType: 'contains'
                    };
                }

                // Add time range filters
                if (timeRange) {
                    const now = Date.now();
                    let startTime: number | undefined;

                    switch (timeRange) {
                        case '5m':
                            startTime = now - (5 * 60 * 1000);
                            break;
                        case '30m':
                            startTime = now - (30 * 60 * 1000);
                            break;
                        case '1h':
                            startTime = now - (60 * 60 * 1000);
                            break;
                        case '6h':
                            startTime = now - (6 * 60 * 60 * 1000);
                            break;
                        case '12h':
                            startTime = now - (12 * 60 * 60 * 1000);
                            break;
                        case '1d':
                            startTime = now - (24 * 60 * 60 * 1000);
                            break;
                        case 'custom':
                            // Use custom range from URL params
                            if (customStartTime) {
                                filters.startTime = parseInt(customStartTime, 10);
                            }
                            if (customEndTime) {
                                filters.endTime = parseInt(customEndTime, 10);
                            }
                            break;
                    }

                    // For non-custom ranges, set startTime and endTime to now
                    if (timeRange !== 'custom' && startTime) {
                        filters.startTime = startTime;
                        filters.endTime = now;
                    }
                }

                // Pass token for Authorization header
                const response = await searchLogs(project.projectId, filters, token);

                // Clear the refresh timer if request completed quickly
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                }

                setLogs(response.logs);
                setPagination(response.pagination);

                // Scroll to top when new logs are loaded (only on initial load)
                if (!hasExistingLogs) {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } catch (err) {
                // Clear the refresh timer on error too
                if (refreshTimer) {
                    clearTimeout(refreshTimer);
                }
                setError(err instanceof Error ? err.message : 'Failed to fetch logs');
            } finally {
                setIsInitialLoad(false);
                setIsRefreshing(false);
            }
        };

        fetchLogs();
    }, [project.projectId, currentPage, levelFilters.join(','), environmentFilters.join(','), hostnameFilters.join(','), searchQuery, timeRange, customStartTime, customEndTime, token, searchParams.get('_refresh')]);

    // Handle filter changes for multi-select
    const toggleLevelFilter = (level: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("level"); // Clear all level params

        const currentLevels = levelFilters;
        let newLevels: string[];

        if (currentLevels.includes(level)) {
            // Remove the level
            newLevels = currentLevels.filter(l => l !== level);
        } else {
            // Add the level
            newLevels = [...currentLevels, level];
        }

        // Add back all selected levels
        newLevels.forEach(l => newParams.append("level", l));

        newParams.set("page", "1"); // Reset to page 1 when filter changes
        setSearchParams(newParams);
    };

    const toggleEnvironmentFilter = (environment: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("environment"); // Clear all environment params

        const currentEnvironments = environmentFilters;
        let newEnvironments: string[];

        if (currentEnvironments.includes(environment)) {
            // Remove the environment
            newEnvironments = currentEnvironments.filter(e => e !== environment);
        } else {
            // Add the environment
            newEnvironments = [...currentEnvironments, environment];
        }

        // Add back all selected environments
        newEnvironments.forEach(e => newParams.append("environment", e));

        newParams.set("page", "1"); // Reset to page 1 when filter changes
        setSearchParams(newParams);
    };

    const toggleHostnameFilter = (hostname: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("hostname"); // Clear all hostname params

        const currentHostnames = hostnameFilters;
        let newHostnames: string[];

        if (currentHostnames.includes(hostname)) {
            // Remove the hostname
            newHostnames = currentHostnames.filter(h => h !== hostname);
        } else {
            // Add the hostname
            newHostnames = [...currentHostnames, hostname];
        }

        // Add back all selected hostnames
        newHostnames.forEach(h => newParams.append("hostname", h));

        newParams.set("page", "1"); // Reset to page 1 when filter changes
        setSearchParams(newParams);
    };

    const handleTimeRangeChange = (range: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (range === 'all') {
            newParams.delete("timeRange");
            newParams.delete("startTime");
            newParams.delete("endTime");
        } else {
            newParams.set("timeRange", range);
            // Clear custom times when selecting quick option
            if (range !== 'custom') {
                newParams.delete("startTime");
                newParams.delete("endTime");
            }
        }
        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const handleCustomTimeRange = (start: string, end: string) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("timeRange", "custom");

        if (start) {
            const startMs = new Date(start).getTime();
            newParams.set("startTime", startMs.toString());
        } else {
            newParams.delete("startTime");
        }

        if (end) {
            const endMs = new Date(end).getTime();
            newParams.set("endTime", endMs.toString());
        } else {
            newParams.delete("endTime");
        }

        newParams.set("page", "1");
        setSearchParams(newParams);
    };

    const clearFilters = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("level");
        newParams.delete("environment");
        newParams.delete("hostname");
        newParams.delete("search");
        newParams.delete("timeRange");
        newParams.delete("startTime");
        newParams.delete("endTime");
        newParams.set("page", "1");
        setSearchParams(newParams);
        setShowCustomRange(false);
    };


    // Helper to build pagination URL with all current filters
    const buildPaginationUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", page.toString());
        return `?${params.toString()}`;
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Application Logs</CardTitle>
                            <CardDescription>
                                View and search application logs from your project
                            </CardDescription>
                        </div>
                        {pagination.total > 0 && (
                            <span className="text-sm text-neutral">
                                {formatNumber(pagination.total)} total logs
                            </span>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="mt-6 space-y-4">
                        {/* Search Bar */}
                        <div className="w-full">
                            <Label htmlFor="search-logs" className="mb-2 block">Search Logs</Label>
                            <div className="relative">
                                <Input
                                    id="search-logs"
                                    type="text"
                                    placeholder="Search across message, stack trace, and details..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="pr-10"
                                />
                                {searchInput && (
                                    <button
                                        onClick={() => setSearchInput("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-primary-dark"
                                        aria-label="Clear search"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                            {searchQuery && (
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand/10 text-brand rounded">
                                        Searching: "{searchQuery}"
                                        <button
                                            onClick={() => setSearchInput("")}
                                            className="hover:text-brand/70"
                                        >
                                            ×
                                        </button>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Time Range Filter */}
                        <div className="flex flex-wrap items-start gap-4">
                            <div className="w-[200px]">
                                <Label htmlFor="time-range" className="mb-2 block">Time Range</Label>
                                <select
                                    id="time-range"
                                    value={timeRange || "all"}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'custom') {
                                            setShowCustomRange(true);
                                            handleTimeRangeChange('custom');
                                        } else {
                                            setShowCustomRange(false);
                                            handleTimeRangeChange(value);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-sm bg-white"
                                >
                                    <option value="all">All Time</option>
                                    <option value="5m">Last 5 minutes</option>
                                    <option value="30m">Last 30 minutes</option>
                                    <option value="1h">Last hour</option>
                                    <option value="6h">Last 6 hours</option>
                                    <option value="12h">Last 12 hours</option>
                                    <option value="1d">Last 24 hours</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {/* Custom Date Range Inputs */}
                            {(showCustomRange || timeRange === 'custom') && (
                                <>
                                    <div className="flex-1 min-w-[200px]">
                                        <Label htmlFor="start-time" className="mb-2 block">Start Time</Label>
                                        <Input
                                            id="start-time"
                                            type="datetime-local"
                                            defaultValue={customStartTime ? moment(parseInt(customStartTime)).format('YYYY-MM-DDTHH:mm') : ''}
                                            onChange={(e) => {
                                                const endValue = customEndTime ? moment(parseInt(customEndTime)).format('YYYY-MM-DDTHH:mm') : '';
                                                handleCustomTimeRange(e.target.value, endValue);
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <Label htmlFor="end-time" className="mb-2 block">End Time</Label>
                                        <Input
                                            id="end-time"
                                            type="datetime-local"
                                            defaultValue={customEndTime ? moment(parseInt(customEndTime)).format('YYYY-MM-DDTHH:mm') : ''}
                                            onChange={(e) => {
                                                const startValue = customStartTime ? moment(parseInt(customStartTime)).format('YYYY-MM-DDTHH:mm') : '';
                                                handleCustomTimeRange(startValue, e.target.value);
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Filter Row */}
                        <div className="flex flex-wrap items-start gap-4">
                            {/* Environment Multi-Select */}
                            <div className="flex-1 min-w-[200px] md:max-w-[15vw]">
                                <Label className="mb-2 block">Environment</Label>
                                <Popover onOpenChange={(open) => {
                                    if (open) {
                                        loadEnvironments();
                                    }
                                }}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <span className="truncate">
                                                {environmentFilters.length === 0
                                                    ? "All Environments"
                                                    : `${environmentFilters.length} selected`}
                                            </span>
                                            <Filter className="ml-2 h-4 w-4 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[250px] p-3">
                                        <div className="space-y-2">
                                            {isLoadingEnvironments ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Activity className="h-4 w-4 text-neutral animate-spin" />
                                                </div>
                                            ) : availableEnvironments.length > 0 ? (
                                                <>
                                                    {availableEnvironments.map((env) => (
                                                        <div key={env.value} className="flex items-center justify-between space-x-2">
                                                            <div className="flex items-center space-x-2 flex-1">
                                                                <Checkbox
                                                                    id={`env-${env.value}`}
                                                                    checked={environmentFilters.includes(env.value)}
                                                                    onCheckedChange={() => toggleEnvironmentFilter(env.value)}
                                                                />
                                                                <label
                                                                    htmlFor={`env-${env.value}`}
                                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                                                >
                                                                    {env.value}
                                                                </label>
                                                            </div>
                                                            <span className="text-xs text-neutral">
                                                                {env.count.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : (
                                                <div className="text-xs text-neutral text-center py-2">
                                                    No environments found
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {environmentFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {environmentFilters.map((env) => (
                                            <span
                                                key={env}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand/10 text-brand rounded"
                                            >
                                                {env}
                                                <button
                                                    onClick={() => toggleEnvironmentFilter(env)}
                                                    className="hover:text-brand/70"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hostname Multi-Select */}
                            <div className="flex-1 min-w-[200px] md:max-w-[15vw]">
                                <Label className="mb-2 block">Hostname</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <span className="truncate">
                                                {hostnameFilters.length === 0
                                                    ? "All Hostnames"
                                                    : `${hostnameFilters.length} selected`}
                                            </span>
                                            <Filter className="ml-2 h-4 w-4 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-3">
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="Add hostname..."
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.currentTarget.value) {
                                                        toggleHostnameFilter(e.currentTarget.value);
                                                        e.currentTarget.value = '';
                                                    }
                                                }}
                                                className="mb-2"
                                            />
                                            {hostnameFilters.length > 0 && (
                                                <>
                                                    <div className="text-xs font-medium text-neutral mb-1">Selected:</div>
                                                    {hostnameFilters.map((hostname) => (
                                                        <div key={hostname} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`hostname-${hostname}`}
                                                                checked={true}
                                                                onCheckedChange={() => toggleHostnameFilter(hostname)}
                                                            />
                                                            <label
                                                                htmlFor={`hostname-${hostname}`}
                                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                            >
                                                                {hostname}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {hostnameFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {hostnameFilters.map((hostname) => (
                                            <span
                                                key={hostname}
                                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-brand/10 text-brand rounded"
                                            >
                                                {hostname}
                                                <button
                                                    onClick={() => toggleHostnameFilter(hostname)}
                                                    className="hover:text-brand/70"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Log Level Multi-Select */}
                            <div className="w-[200px]">
                                <Label className="mb-2 block">Log Level</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            <span className="truncate">
                                                {levelFilters.length === 0
                                                    ? "All Levels"
                                                    : `${levelFilters.length} selected`}
                                            </span>
                                            <Filter className="ml-2 h-4 w-4 shrink-0" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-3">
                                        <div className="space-y-2">
                                            {['INFO', 'DEBUG', 'WARNING', 'ERROR', 'CRITICAL'].map((level) => (
                                                <div key={level} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`level-${level}`}
                                                        checked={levelFilters.includes(level)}
                                                        onCheckedChange={() => toggleLevelFilter(level)}
                                                    />
                                                    <label
                                                        htmlFor={`level-${level}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {level}
                                                    </label>
                                                </div>
                                            ))}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                {levelFilters.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {levelFilters.map((level) => {
                                            const style = getLogLevelStyle(level);
                                            return (
                                                <span
                                                    key={level}
                                                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${style.bgColor} ${style.color}`}
                                                >
                                                    {level}
                                                    <button
                                                        onClick={() => toggleLevelFilter(level)}
                                                        className="hover:opacity-70"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsRefreshing(true);
                                        // Force a re-fetch by updating a timestamp or similar trigger
                                        const currentParams = new URLSearchParams(searchParams);
                                        currentParams.set('_refresh', Date.now().toString());
                                        setSearchParams(currentParams, { replace: true });
                                    }}
                                    disabled={isInitialLoad || isRefreshing}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    {isRefreshing ? 'Reloading...' : 'Reload Logs'}
                                </Button>
                                {(levelFilters.length > 0 || environmentFilters.length > 0 || hostnameFilters.length > 0 || searchQuery || timeRange) && (
                                    <Button
                                        variant="outline"
                                        onClick={clearFilters}
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative">
                    {/* Soft overlay loader */}
                    {isRefreshing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-200">
                                <Activity className="h-4 w-4 text-brand animate-spin" />
                                <span className="text-sm text-neutral">Updating...</span>
                            </div>
                        </div>
                    )}

                    {isInitialLoad ? (
                        <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-neutral mx-auto mb-4 animate-spin" />
                            <p className="text-neutral">Loading logs...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-neutral mx-auto mb-4" />
                            <p className="text-neutral">No application logs found</p>
                            <p className="text-sm text-neutral mt-2">
                                Logs will appear here once your application starts sending data
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Top Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="mb-6 pb-6 border-b border-gray-200">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    to={pagination.page > 1 ? buildPaginationUrl(pagination.page - 1) : "#"}
                                                    aria-disabled={pagination.page === 1}
                                                    className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {/* Generate page numbers */}
                                            {getPageNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) => (
                                                pageNum === "ellipsis" ? (
                                                    <PaginationItem key={`ellipsis-${idx}`}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                ) : (
                                                    <PaginationItem key={`page-${pageNum}-${idx}`}>
                                                        <PaginationLink
                                                            to={buildPaginationUrl(pageNum as number)}
                                                            isActive={pageNum === pagination.page}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    to={pagination.page < pagination.totalPages ? buildPaginationUrl(pagination.page + 1) : "#"}
                                                    aria-disabled={pagination.page === pagination.totalPages}
                                                    className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}

                            <div className="space-y-2">
                                {logs.map((log) => (
                                    <LogCard
                                        key={log._id}
                                        log={log}
                                        onAddAlarm={(selectedLog) => {
                                            setSelectedLogForAlarm(selectedLog);
                                            setShowAddAlarmModal(true);
                                        }}
                                        canCreateAlarm={canCreateAlarm}
                                    />
                                ))}
                            </div>

                            {/* Bottom Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    to={pagination.page > 1 ? buildPaginationUrl(pagination.page - 1) : "#"}
                                                    aria-disabled={pagination.page === 1}
                                                    className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>

                                            {/* Generate page numbers */}
                                            {getPageNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) => (
                                                pageNum === "ellipsis" ? (
                                                    <PaginationItem key={`ellipsis-${idx}`}>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                ) : (
                                                    <PaginationItem key={`page-${pageNum}-${idx}`}>
                                                        <PaginationLink
                                                            to={buildPaginationUrl(pageNum as number)}
                                                            isActive={pageNum === pagination.page}
                                                        >
                                                            {pageNum}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    to={pagination.page < pagination.totalPages ? buildPaginationUrl(pagination.page + 1) : "#"}
                                                    aria-disabled={pagination.page === pagination.totalPages}
                                                    className={pagination.page === pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add Alarm Modal */}
            <Dialog open={showAddAlarmModal} onOpenChange={setShowAddAlarmModal}>
                <DialogContent onClose={() => setShowAddAlarmModal(false)}>
                    <DialogHeader>
                        <DialogTitle>Add Alarm</DialogTitle>
                        <DialogDescription>
                            Create an alarm based on the given criteria.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {selectedLogForAlarm && (
                            <AddAlarmForm
                                projectId={project.projectId}
                                token={token}
                                initialMessage={selectedLogForAlarm.message}
                                initialLevel={selectedLogForAlarm.level}
                                initialEnvironment={selectedLogForAlarm.environment}
                                userEmail={userEmail}
                                onSubmit={(alarmData) => {
                                    setCreatedAlarmData(alarmData);
                                    setShowAddAlarmModal(false);
                                    setSelectedLogForAlarm(null);
                                    setShowAlarmSuccessModal(true);
                                }}
                                onCancel={() => setShowAddAlarmModal(false)}
                            />
                        )}
                    </DialogBody>
                </DialogContent>
            </Dialog>

            {/* Alarm Success Modal */}
            <Dialog open={showAlarmSuccessModal} onOpenChange={setShowAlarmSuccessModal}>
                <DialogContent onClose={() => setShowAlarmSuccessModal(false)}>
                    <DialogHeader>
                        <DialogTitle>Alarm Created Successfully!</DialogTitle>
                        <DialogDescription>
                            Your alarm has been created and is now monitoring your logs.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogBody>
                        {createdAlarmData && (
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Alarm is now active and monitoring logs</span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium text-gray-700">Message Pattern:</span>
                                        <span className="ml-2 text-gray-900">{createdAlarmData.message}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Environment:</span>
                                        <span className="ml-2 text-gray-900">{createdAlarmData.environment}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Log Level:</span>
                                        <span className="ml-2 text-gray-900">{createdAlarmData.level}</span>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-700">Delivery Methods:</span>
                                        <div className="ml-2 text-gray-900">
                                            {createdAlarmData.deliveryMethods?.email && (
                                                <div>📧 Email: {createdAlarmData.deliveryMethods.email.addresses.join(', ')}</div>
                                            )}
                                            {createdAlarmData.deliveryMethods?.slack && (
                                                <div>💬 Slack webhook configured</div>
                                            )}
                                            {createdAlarmData.deliveryMethods?.webhook && (
                                                <div>🔗 Custom webhook configured</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <Button onClick={() => setShowAlarmSuccessModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

