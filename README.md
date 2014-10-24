[![Build Status](https://travis-ci.org/sbebrone/makemeasandwich.js.svg)](https://travis-ci.org/sbebrone/makemeasandwich.js)

makemeasandwich.js
==========================
This is a Node.js application that is capable of ordering a LunchTime sandwich via command line, bringing to life this legendary XKCD comic.

![](http://imgs.xkcd.com/comics/sandwich.png)

It does this through the combination of Node.js + PhantomJS along with some other command line prompt tools that makes ordering a sandwich even more freaky fast.

Article
---------------------------
To read more about this project and why original author built it, go to <a href="http://travistidwell.com/blog/2013/09/01/sudo-make-me-a-sandwich">http://travistidwell.com/blog/2013/09/01/sudo-make-me-a-sandwich</a>

Installation
---------------------------
To install this application on your computer, you can simply use NPM to install it as a global command.

```
npm install -g makemeasandwich
```

Usage
---------------------------
To run this command, simply type it in your terminal.

```
makemeasandwich
```

Or, if you want to stay true to the comic...

```
sudo makemeasandwich
```

This will then walk you through the login process, as well as sandwich selection process, and even checkout... all through the command line.  You can also provide configurations to make each order super simple.  This is done via a JSON file that you can pass into the application using the ```o``` argument like so.

```
sudo makemeasandwich -o order.json
```

This order json file looks like the following...

```
{
  "email": "",
  "sandwich": "country club",
}
```

If you'd like to save the order json for repeated use, simply add it next to the executable. However, do note that using `-o order.json` will override the saved config.json.

Using the Makefile
------------------------------
If you navigate to the downloaded folder within your terminal, you can then use the ```Makefile``` to type the command as it is in the XKCD comic.

```
sudo make me a sandwich
```

Debugging & Troubleshooting
------------------------------
You can provide a debug argument which it will capture a screenshot within the "screenshots" folder for every step in the process.  This is a good way
for you to see what exactly the script is doing as it is doing it, as well as debug if any issues occur.

```
sudo makemeasandwich -o myorder.json --debug
```
