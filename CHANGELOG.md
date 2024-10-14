# Changelog

This file tracks released versions with the changes made to this project.

## Version 0.2.0

### New

- Now using `yarn`.
- Updated UI for getting and setting properties.
- Using `useRef` to keep better track of state changes that occur when `onCaptureEvent` listens outside of the context of the React app.
- Incorporated an `openDeviceHelper` method to move device opening code out of `onCaptureEvent`.
- Updated UI for tracking BLE Device Manager status.
  - Added a case statement for `CaptureEventIds.DeviceManagerArrival`.
  - Added support for opening the BLE Device Manager (`openDeviceHelper`).
- Incorporating `web-vitals` for optional React app web performance reporting.
- Removing reference to `ReactDOM.render` as it is deprecated and replacing it with `ReactDOM.createRoot`.
- Included `@babel/plugin-proposal-private-property-in-object` to suppress `One of your dependencies, babel-preset-react-app, is importing the
"@babel/plugin-proposal-private-property-in-object" package without
declaring it in its dependencies.` warning.
- Updated `README.md` to mention new UI.
- Added a `CHANGELOG.md` file to track changes to new version.

### Improvements

- Updated the `socketmobile-capturejs` version to `1.3.50`.
- Updated the `react` version to `18.2.0`.
- Updated the `react-dom` version to `^18.2.0`.
- Updated the `@testing-library/jest-dom` version to `^5.17.0`.
- Updated the `@testing-library/react` version to `^13.4.0`.
- Updated the `@testing-library/user-event` version to `^13.5.0`.
- Removed use of `useCallback` and instead declared `onCaptureEvent` as an arrow function.

## Version 0.1.0

- The first iteration of Single Entry React sample app.
