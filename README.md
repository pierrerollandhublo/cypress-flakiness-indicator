# Cypress flakiness indicator

This is a user script that applies on Cypress runs overviews, and colorizes the failed test rows to easily determine if a test is flaky, or broken.
In addition, it displays a summary of the previous runs statuses of every failed test, to better evaluate the health of the test.

## Colors

- If the row is displayed in green, it means the test has been broken for all the previous runs we could collect, thus has not been broken by your run
- If the row is displayed in yellow, it means the test is sometimes failing, thus is flaky
- If the row is displayed in red, it means the test is usually passing, and you may have broken it!

## Install

This userscript can be install using the [Tampermonkey](https://www.tampermonkey.net/) browser extension (compatible with all major browsers).

Once installed, navigate to the Dashboard, hit the "+" button, and copy/paste the script from this repo. It will apply on Cypress Cloud overviews.
