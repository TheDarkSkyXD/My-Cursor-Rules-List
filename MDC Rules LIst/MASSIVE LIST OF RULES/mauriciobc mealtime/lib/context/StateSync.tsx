import { useEffect } from 'react';
import { useCats } from './CatsContext';
import { useFeeding } from './FeedingContext';
import { useHousehold } from './HouseholdContext';
import { eventSystem } from '../utils/EventSystem';

export const StateSync = () => {
  const { dispatch: catsDispatch } = useCats();
  const { dispatch: feedingDispatch } = useFeeding();
  const { dispatch: householdDispatch } = useHousehold();

  useEffect(() => {
    const handleCatsUpdate = (updatedState: any) => {
      // Sync cats state using valid action type
      catsDispatch({ type: 'FETCH_SUCCESS', payload: updatedState });
    };

    const handleFeedingsUpdate = (updatedState: any) => {
      // Sync feedings state using valid action type
      feedingDispatch({ type: 'FETCH_SUCCESS', payload: updatedState });
    };

    const handleHouseholdUpdate = (updatedState: any) => {
      // Sync household state using valid action type
      householdDispatch({ type: 'FETCH_SUCCESS', payload: updatedState });
    };

    eventSystem.on('catsUpdated', handleCatsUpdate);
    eventSystem.on('feedingsUpdated', handleFeedingsUpdate);
    eventSystem.on('householdUpdated', handleHouseholdUpdate);

    return () => {
      eventSystem.off('catsUpdated', handleCatsUpdate);
      eventSystem.off('feedingsUpdated', handleFeedingsUpdate);
      eventSystem.off('householdUpdated', handleHouseholdUpdate);
    };
  }, [catsDispatch, feedingDispatch, householdDispatch]);

  return null;
};