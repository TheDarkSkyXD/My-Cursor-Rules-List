import React, { ReactNode, useEffect } from 'react';
import { useCats } from './CatsContext';
import { useFeeding } from './FeedingContext';
import { useHousehold } from './HouseholdContext';
import { eventSystem } from '../utils/EventSystem';

export const ContextBridge = ({ children }: { children: ReactNode }) => {
  const { state: catsState } = useCats();
  const { state: feedingState } = useFeeding();
  const { state: householdState } = useHousehold();

  useEffect(() => {
    eventSystem.emit('catsUpdated', catsState);
  }, [catsState]);

  useEffect(() => {
    eventSystem.emit('feedingsUpdated', feedingState);
  }, [feedingState]);

  useEffect(() => {
    eventSystem.emit('householdUpdated', householdState);
  }, [householdState]);

  return <>{children}</>;
};