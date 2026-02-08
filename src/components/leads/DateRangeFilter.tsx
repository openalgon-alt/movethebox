
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon, Check } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format, startOfMonth, endOfMonth, subDays, subMonths, isSameDay } from "date-fns"
import { useState, useEffect } from "react"

interface DateRangeFilterProps {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    className?: string
}

export function DateRangeFilter({
    date,
    setDate,
    className,
}: DateRangeFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [tempDate, setTempDate] = useState<DateRange | undefined>(date)
    const [month, setMonth] = useState<Date>(new Date())

    // Sync temp state and month with prop when opening
    useEffect(() => {
        if (isOpen) {
            setTempDate(date)
            if (date?.from) {
                setMonth(date.from)
            }
        }
    }, [isOpen, date])

    const handleApply = () => {
        setDate(tempDate)
        setIsOpen(false)
    }

    const handlePreset = (preset: 'today' | 'yesterday' | 'lastWeek' | 'lastMonth' | 'allTime') => {
        const today = new Date()
        const newMonth = new Date(today) // Default to current month usually

        switch (preset) {
            case 'today':
                setTempDate({ from: today, to: today })
                setMonth(today)
                break
            case 'yesterday':
                const yesterday = subDays(today, 1)
                setTempDate({ from: yesterday, to: yesterday })
                setMonth(yesterday)
                break
            case 'lastWeek':
                const lastWeek = subDays(today, 6)
                setTempDate({ from: lastWeek, to: today })
                setMonth(lastWeek)
                break
            case 'lastMonth':
                const lastMonth = subMonths(today, 1)
                const startOfLast = startOfMonth(lastMonth);
                setTempDate({ from: startOfLast, to: endOfMonth(lastMonth) })
                setMonth(startOfLast)
                break
            case 'allTime':
                // Set a massive range to cover "All Time"
                setTempDate({ from: new Date(2000, 0, 1), to: new Date(2100, 0, 1) })
                setMonth(today)
                break
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                isSameDay(date.from, date.to) ? (
                                    format(date.from, "LLL dd, y")
                                ) : (
                                    <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                    </>
                                )
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Filter by next follow-up</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <div className="flex flex-col">
                        {/* Presets */}
                        <div className="p-3 border-b grid grid-cols-2 gap-2">
                            {/* ... (Keep existing presets buttons) */}
                            <Button variant="outline" size="sm" onClick={() => handlePreset('today')}>Today</Button>
                            <Button variant="outline" size="sm" onClick={() => handlePreset('yesterday')}>Yesterday</Button>
                            <Button variant="outline" size="sm" onClick={() => handlePreset('lastWeek')}>Last Week</Button>
                            <Button variant="outline" size="sm" onClick={() => handlePreset('lastMonth')}>Last Month</Button>
                        </div>

                        {/* Calendar */}
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={month}
                            month={month}
                            onMonthChange={setMonth}
                            selected={tempDate}
                            onSelect={setTempDate}
                            numberOfMonths={1}
                        />

                        {/* Footer */}
                        <div className="p-3 border-t flex justify-end gap-2 bg-muted/10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setTempDate(undefined)
                                }}
                            >
                                Clear
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleApply}
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
