"use client";
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";

export default function TestCalendarPage() {
  return (
    <div style={{ padding: 32 }}>
      <h1>DayPicker Dropdown Test</h1>
      <DayPicker
        captionLayout="dropdown"
        fromYear={2000}
        toYear={2030}
      />
    </div>
  );
} 