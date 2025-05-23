"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeField({ value, onChange, disabled = false }: TimeFieldProps) {
  const [hours, setHours] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");

  // Inicializar os valores de horas e minutos a partir do valor recebido
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":");
      setHours(h || "");
      setMinutes(m || "");
    }
  }, [value]);

  // Atualizar o valor quando as horas ou minutos mudarem
  const updateValue = (newHours: string, newMinutes: string) => {
    if (newHours && newMinutes) {
      onChange(`${newHours.padStart(2, "0")}:${newMinutes.padStart(2, "0")}`);
    } else {
      onChange("");
    }
  };

  // Manipular mudança nas horas
  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHours = e.target.value;
    if (newHours === "" || (parseInt(newHours) >= 0 && parseInt(newHours) <= 23)) {
      setHours(newHours);
      updateValue(newHours, minutes);
    }
  };

  // Manipular mudança nos minutos
  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMinutes = e.target.value;
    if (newMinutes === "" || (parseInt(newMinutes) >= 0 && parseInt(newMinutes) <= 59)) {
      setMinutes(newMinutes);
      updateValue(hours, newMinutes);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        min="0"
        max="23"
        placeholder="HH"
        value={hours}
        onChange={handleHoursChange}
        className="w-16 text-center"
        disabled={disabled}
      />
      <span className="text-lg">:</span>
      <Input
        type="number"
        min="0"
        max="59"
        placeholder="MM"
        value={minutes}
        onChange={handleMinutesChange}
        className="w-16 text-center"
        disabled={disabled}
      />
    </div>
  );
} 