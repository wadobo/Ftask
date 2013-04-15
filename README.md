## Ftask

That's a simple task TODO list proof of concept application using
flask and mongodb in server part and backbone in client side.

## Supported browsers

All the modern browsers are supported. However, due to the differences in 
browser's implementation, there could be some bugs on the implementation. You
can read below the current status on the most known browsers.

- Firefox
    - Developed and tested continuously on Firefox Nigthly.
    - Works on 21.0a1
    - Works on Firefox 8.0a2
    - Works on Firefox Mobile 19.0
- Google Chrome/Chromium
    - Fully tested and working on version 26.0.1410.5 dev
- Android
    - Partially working on Android version 2.3.4 \[U.A.: AppleWebKit/533.1\] 
      (Filtering doesn't work)
- Opera
    - Fully tested and working on version 12.14 build 1738 amd64
- Internet Explorer
    - Not tested
- Epiphany
    - Works on Epiphany 3.2.1 \[U.A.: AppleWebKit/535.4+\] (Filter popover bad
      rendered)
- Safari
    - Not tested
- iPhone/iPad
    - Not tested


**Note**: In all the not tested browsers should, at least, partially work.
I'll try to extend the testing to all the browsers but right know I can only
ensure FTask works on Firefox Nigthly. 

Fixes for the failures on the above listed browsers are on the way.
