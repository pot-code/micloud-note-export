# Usage

## Step1 Install dependencies

For windows user:

1. go to NodeJS offcial website, download the latest version, install it
2. navigate to project folder
3. open the powershell or execute `cmd.exe`

Install npm packages:

```shell
# if yarn has installed
yarn

# or
npm
```

## Step2 Fill in cookie data

1. login to https://i.mi.com
2. open the browser developer tool by pressing `F12`
3. go to **Application** tab, choose **Cookies** in left sidebar, expand it and choose the only item in it. Noticed that a table appears on the right column
4. create a txt file in project folder, rename it to **cookie.txt**. The first line of the content goes for `userId` value, while the second line should be `serviceToken` value
5. save the txt file

## Step3 Run it

> You may specify the custom cookie file by passing the additional argument to `node index.js`

1. navigate to project folder

2. type:

   ```shell
   node index.js
   ```

3. wait for completion

4. if everythings goes well, the content of `output.json` file in your folder should be all you want, or it's empty due to the error, feel free to overwrite it in the next run

If any issue occurs, let me know it.

# TODO

- [ ] add cross platform support
- [ ] if the `output.json` is empty, skip the question step
- [ ] check sequence of token and id parameters
- [ ] flexible output format and structure