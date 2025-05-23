"use client"

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { add, format } from "date-fns";
import { type Locale, enUS } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import * as React from "react";
import { useImperativeHandle, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { useUserContext } from "@/lib/context/UserContext"
import { resolveDateFnsLocale } from "@/lib/utils/dateFnsLocale"

// ---------- utils start ----------
function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}
function isValid12Hour(value: string) {
  return /^(0[1-9]|1[0-2])$/.test(value);
}
function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}
type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };
function getValidNumber(value: string, { max, min = 0, loop = false }: GetValidNumberConfig) {
  let numericValue = parseInt(value, 10);
  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, '0');
  }
  return '00';
}
function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}
function getValid12Hour(value: string) {
  if (isValid12Hour(value)) return value;
  return getValidNumber(value, { min: 1, max: 12 });
}
function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}
type GetValidArrowNumberConfig = { min: number; max: number; step: number };
function getValidArrowNumber(value: string, { min, max, step }: GetValidArrowNumberConfig) {
  let numericValue = parseInt(value, 10);
  if (!Number.isNaN(numericValue)) {
    numericValue += step;
    return getValidNumber(String(numericValue), { min, max, loop: true });
  }
  return '00';
}
function getValidArrowHour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 23, step });
}
function getValidArrow12Hour(value: string, step: number) {
  return getValidArrowNumber(value, { min: 1, max: 12, step });
}
function getValidArrowMinuteOrSecond(value: string, step: number) {
  return getValidArrowNumber(value, { min: 0, max: 59, step });
}
function setMinutes(date: Date, value: string) {
  const minutes = getValidMinuteOrSecond(value);
  date.setMinutes(parseInt(minutes, 10));
  return date;
}
function setSeconds(date: Date, value: string) {
  const seconds = getValidMinuteOrSecond(value);
  date.setSeconds(parseInt(seconds, 10));
  return date;
}
function setHours(date: Date, value: string) {
  const hours = getValidHour(value);
  date.setHours(parseInt(hours, 10));
  return date;
}
function set12Hours(date: Date, value: string, period: Period) {
  const hours = parseInt(getValid12Hour(value), 10);
  const convertedHours = convert12HourTo24Hour(hours, period);
  date.setHours(convertedHours);
  return date;
}
type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours';
type Period = 'AM' | 'PM';
function setDateByType(date: Date, value: string, type: TimePickerType, period?: Period) {
  switch (type) {
    case 'minutes':
      return setMinutes(date, value);
    case 'seconds':
      return setSeconds(date, value);
    case 'hours':
      return setHours(date, value);
    case '12hours': {
      if (!period) return date;
      return set12Hours(date, value, period);
    }
    default:
      return date;
  }
}
function getDateByType(date: Date | null, type: TimePickerType) {
  if (!date) return '00';
  switch (type) {
    case 'minutes':
      return getValidMinuteOrSecond(String(date.getMinutes()));
    case 'seconds':
      return getValidMinuteOrSecond(String(date.getSeconds()));
    case 'hours':
      return getValidHour(String(date.getHours()));
    case '12hours':
      return getValid12Hour(String(display12HourValue(date.getHours())));
    default:
      return '00';
  }
}
function getArrowByType(value: string, step: number, type: TimePickerType) {
  switch (type) {
    case 'minutes':
      return getValidArrowMinuteOrSecond(value, step);
    case 'seconds':
      return getValidArrowMinuteOrSecond(value, step);
    case 'hours':
      return getValidArrowHour(value, step);
    case '12hours':
      return getValidArrow12Hour(value, step);
    default:
      return '00';
  }
}
function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === 'PM') {
    if (hour <= 11) {
      return hour + 12;
    }
    return hour;
  }
  if (period === 'AM') {
    if (hour === 12) return 0;
    return hour;
  }
  return hour;
}
function display12HourValue(hours: number) {
  if (hours === 0 || hours === 12) return '12';
  if (hours >= 22) return `${hours - 12}`;
  if (hours % 12 > 9) return `${hours}`;
  return `0${hours % 12}`;
}
function genMonths(locale: Pick<Locale, 'options' | 'localize' | 'formatLong'>) {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2021, i), 'MMMM', { locale }),
  }));
}
function genYears(yearRange = 50) {
  const today = new Date();
  return Array.from({ length: yearRange * 2 + 1 }, (_, i) => ({
    value: today.getFullYear() - yearRange + i,
    label: (today.getFullYear() - yearRange + i).toString(),
  }));
}
// ---------- utils end ----------

function Calendar({ className, classNames, showOutsideDays = true, yearRange = 50, ...props }: DayPickerProps & { yearRange?: number }) {
  const MONTHS = React.useMemo(() => {
    let locale: Pick<Locale, 'options' | 'localize' | 'formatLong'> = enUS;
    const { options, localize, formatLong } = props.locale || enUS;
    if (options && localize && formatLong) {
      locale = { ...enUS, options, localize, formatLong };
    }
    return genMonths(locale);
  }, [props.locale]);
  const YEARS = React.useMemo(() => genYears(yearRange), [yearRange]);
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-4 w-4" {...props} />;
        },
      }}
      fromYear={YEARS[0].value}
      toYear={YEARS[YEARS.length - 1].value}
      {...props}
    />
  );
}

// TimePickerInput and TimePicker components
const TimePickerInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      className={cn("w-12 text-center", className)}
      maxLength={2}
      {...props}
    />
  )
);
TimePickerInput.displayName = "TimePickerInput";

interface TimePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  hourCycle?: 12 | 24;
  granularity?: 'second' | 'minute' | 'hour';
}
const TimePicker: React.FC<TimePickerProps> = ({ date, onChange, hourCycle = 24, granularity = 'second' }) => {
  const [hour, setHour] = React.useState(getDateByType(date, hourCycle === 24 ? 'hours' : '12hours'));
  const [minute, setMinute] = React.useState(getDateByType(date, 'minutes'));
  const [second, setSecond] = React.useState(getDateByType(date, 'seconds'));
  const [period, setPeriod] = React.useState<Period>(date.getHours() >= 12 ? 'PM' : 'AM');

  React.useEffect(() => {
    let newDate = new Date(date);
    if (hourCycle === 24) {
      newDate = setHours(newDate, hour);
    } else {
      newDate = set12Hours(newDate, hour, period);
    }
    newDate = setMinutes(newDate, minute);
    if (granularity === 'second') {
      newDate = setSeconds(newDate, second);
    }
    onChange(newDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, second, period]);

  return (
    <div className="flex items-center gap-2">
      <TimePickerInput
        value={hour}
        onChange={e => setHour(e.target.value)}
        aria-label="Hour"
      />
      <span>:</span>
      <TimePickerInput
        value={minute}
        onChange={e => setMinute(e.target.value)}
        aria-label="Minute"
      />
      {granularity === 'second' && (
        <>
          <span>:</span>
          <TimePickerInput
            value={second}
            onChange={e => setSecond(e.target.value)}
            aria-label="Second"
          />
        </>
      )}
      {hourCycle === 12 && (
        <Select value={period} onValueChange={v => setPeriod(v as Period)}>
          <SelectTrigger className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

// Main DateTimePicker
interface DateTimePickerProps {
  locale?: Locale;
  defaultPopupValue?: Date;
  value?: Date;
  onChange?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  hourCycle?: 12 | 24;
  yearRange?: number;
  disabled?: boolean;
  displayFormat?: { hour24?: string; hour12?: string };
  granularity?: 'second' | 'minute' | 'hour' | 'day';
  placeholder?: string;
  className?: string;
}
interface DateTimePickerRef {
  value?: Date;
  reset?: () => void;
}
const DateTimePicker = React.forwardRef<Partial<DateTimePickerRef>, DateTimePickerProps>(
  (
    {
      locale = enUS,
      defaultPopupValue = new Date(new Date().setHours(0, 0, 0, 0)),
      value,
      onChange,
      onMonthChange,
      hourCycle = 24,
      yearRange = 50,
      disabled = false,
      displayFormat,
      granularity = 'second',
      placeholder = 'Pick a date',
      className,
      ...props
    },
    ref,
  ) => {
    const [month, setMonth] = React.useState<Date>(value ?? defaultPopupValue);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [displayDate, setDisplayDate] = React.useState<Date | undefined>(value ?? undefined);
    onMonthChange ||= onChange;
    React.useEffect(() => {
      setDisplayDate(value);
    }, [value]);
    const handleMonthChange = (newDay: Date | undefined) => {
      if (!newDay) {
        return;
      }
      if (!defaultPopupValue) {
        newDay.setHours(month?.getHours() ?? 0, month?.getMinutes() ?? 0, month?.getSeconds() ?? 0);
        onMonthChange?.(newDay);
        setMonth(newDay);
        return;
      }
      const diff = newDay.getTime() - defaultPopupValue.getTime();
      const diffInDays = diff / (1000 * 60 * 60 * 24);
      const newDateFull = add(defaultPopupValue, { days: Math.ceil(diffInDays) });
      newDateFull.setHours(
        month?.getHours() ?? 0,
        month?.getMinutes() ?? 0,
        month?.getSeconds() ?? 0,
      );
      onMonthChange?.(newDateFull);
      setMonth(newDateFull);
    };
    const onSelect = (newDay?: Date) => {
      if (!newDay) {
        return;
      }
      onChange?.(newDay);
      setMonth(newDay);
      setDisplayDate(newDay);
    };
    useImperativeHandle(
      ref,
      () => ({
        ...buttonRef.current,
        value: displayDate,
        reset: () => {
          setDisplayDate(undefined);
          setMonth(defaultPopupValue);
          onChange?.(undefined);
        },
      }),
      [displayDate, defaultPopupValue, onChange],
    );
    const initHourFormat = {
      hour24:
        displayFormat?.hour24 ??
        `PPP HH:mm${!granularity || granularity === 'second' ? ':ss' : ''}`,
      hour12:
        displayFormat?.hour12 ??
        `PP hh:mm${!granularity || granularity === 'second' ? ':ss' : ''} b`,
    };

    const { state: userState } = useUserContext();
    const userLanguage = userState.currentUser?.preferences?.language;
    const userLocale = resolveDateFnsLocale(userLanguage);

    return (
      <Popover>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !displayDate && 'text-muted-foreground',
              className,
            )}
            ref={buttonRef}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate ? (
              format(
                displayDate,
                hourCycle === 24 ? initHourFormat.hour24 : initHourFormat.hour12,
                {
                  locale: userLocale,
                },
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={displayDate}
            month={month}
            onSelect={(newDate) => {
              if (newDate) {
                newDate.setHours(
                  month?.getHours() ?? 0,
                  month?.getMinutes() ?? 0,
                  month?.getSeconds() ?? 0,
                );
                onSelect(newDate);
              }
            }}
            onMonthChange={handleMonthChange}
            yearRange={yearRange}
            locale={locale}
            {...props}
          />
          {granularity !== 'day' && (
            <div className="border-border border-t p-3">
              <TimePicker
                onChange={(value) => {
                  onChange?.(value);
                  setDisplayDate(value);
                  if (value) {
                    setMonth(value);
                  }
                }}
                date={month}
                hourCycle={hourCycle}
                granularity={granularity}
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    );
  },
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker, TimePickerInput, TimePicker };
export type { TimePickerType, DateTimePickerProps, DateTimePickerRef };
