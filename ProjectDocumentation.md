# Carbon Tracking App Documentation

## Overview
This project is a Flutter-based mobile application for tracking carbon emissions based on user travel activity. It allows users to input travel distance and select a mode of transport to calculate estimated CO2 emissions.

## Project Structure

- **android/**, **ios/**, **linux/**, **macos/**, **windows/**: Platform-specific code and configuration for building the app on different operating systems.
- **assets/**: Contains images and icons used in the app, such as `background_image.jpg` and `image.png`.
- **build/**: Generated build files (can be ignored for documentation).
- **lib/**: Main Dart source code for the app.
  - `main.dart`: Entry point and main logic for the carbon emission calculator UI and functionality.
- **test/**: Contains test files for the app (e.g., `widget_test.dart`).
- **web/**: Web-specific files for Flutter web builds.
- **pubspec.yaml**: Project configuration, dependencies, and asset declarations.
- **README.md**: Basic project information and Flutter resource links.

## Main Features
- **Carbon Emission Calculator**: Users enter a distance (in km) and select a mode of transport (Car, Bus, Train, Bike). The app calculates and displays the estimated CO2 emissions for the trip.
- **Modes of Transport**:
  - Car: 0.2 kg CO2 per km
  - Bus: 0.1 kg CO2 per km
  - Train: 0.05 kg CO2 per km
  - Bike: 0.0 kg CO2 per km
- **Modern UI**: Uses Material Design, background image, and styled widgets for a clean user experience.

## How It Works
- The main logic is in `lib/main.dart`.
- The user inputs a distance and selects a transport mode.
- When the user taps "Calculate", the app multiplies the distance by the emission factor for the selected mode and displays the result.

## Configuration
- **pubspec.yaml** lists dependencies (Flutter SDK, launcher icons, lints) and declares assets.
- **Assets**: Images are stored in `assets/` and referenced in code and configuration.

## Getting Started
1. Ensure you have Flutter installed (see [Flutter docs](https://docs.flutter.dev/)).
2. Run `flutter pub get` to fetch dependencies.
3. Run the app with `flutter run` from the `carbon_tracking_app` directory.

## Customization
- To add more transport modes or change emission factors, edit the `_modeFactors` map in `lib/main.dart`.
- To change the background image, replace `assets/background_image.jpg` and update `pubspec.yaml` if needed.

## License
This project is for educational purposes.

---
*Generated on October 10, 2025.*
