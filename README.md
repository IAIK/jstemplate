# JavaScript Template Attacks

JavaScript Template Attacks is a tool to automatically find subtle differences in browser engines caused by the environment. 
The main use case of JavaScript Template Attacks is to provide an automated augmentation for the development process of defense mechanisms. 
However, it can also be used to aid in the search for fingerprints or to get a more precise picture of a victim's environment for targeted exploitation.

## Setup

The tool is implemented entirely in JavaScript. The frontend runs inside the browser, and the backend in Node.js. 
Setting up the tool is as simple as running

    node server
    
This command starts a local server listening on port 8080.

## Usage

Open [http://localhost:8080](http://localhost:8080) in the browser to get to the main menu of the tool. The main site shows all recorded profiles and provides different functions described in this section. 

### Record

Records a new profile. Click on this button with a browser of which a (new) profile should be recorded. The page asks for a unique identifier of this profile. By default, this is the user agent of the browser.

### Profiles

A list of all profiles in the template, including the number of recorded properties. 

#### Delete

Deletes a profile. Note that a deleted profile cannot be restored. 

#### Record more Traces

This triggers another collection step for a profile. Recording more traces should be done until the number of properties converges to a stable value. Usually, this is 2 to 4 times. 

### Compare

Compares two profiles of the template to find leaking properties. SImply select two profiles to compare. The comparison page lists all properties where the values differ and shows the number of different properties at the end. 


## License

The code is licensed under the MIT license.
