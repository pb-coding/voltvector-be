// Apps ending in "1" are responsible for the timeslot between XX:45 and XX:00
// Apps ending in "2" are responsible for the timeslot between XX:00 and XX:15
// Apps ending in "3" are responsible for the timeslot between XX:15 and XX:30
// Apps ending in "4" are responsible for the timeslot between XX:30 and XX:45
export const enphaseAppTimeplan = {
  0: "1",
  15: "2",
  30: "3",
  45: "4",
};
