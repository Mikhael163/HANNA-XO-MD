const got = require("got");
const Heroku = require("heroku-client");
const { command, isPrivate, tiny } = require("../lib/");
const Config = require("../config");
const heroku = new Heroku({ token: Config.HEROKU_API_KEY });
const baseURI = "/apps/" + Config.HEROKU_APP_NAME;
const simpleGit = require("simple-git");
const { secondsToDHMS } = require("../lib");
const git = simpleGit();
const exec = require("child_process").exec;


command(
  {
    pattern: "update",
    fromMe: true,
    type: "heroku",
    desc: "Checks for update.",
  },
  async (message, match,) => {
    let {prefix} = message
    if (match === "now") {
      await git.fetch();
      var commits = await git.log([
        Config.BRANCH + "..origin/" + Config.BRANCH,
      ]);
      if (commits.total === 0) {
        return await message.sendMessage("_Already on latest version_");
      } else {
        await message.reply("_Update Started_");

        try {
          var app = await heroku.get("/apps/" + Config.HEROKU_APP_NAME);
        } catch {
          await message.sendMessage("_Invalid Heroku Details_");
          await new Promise((r) => setTimeout(r, 1000));
        }

        git.fetch("upstream", Config.BRANCH);
        git.reset("hard", ["FETCH_HEAD"]);

        var git_url = app.git_url.replace(
          "https://",
          "https://api:" + Config.HEROKU_API_KEY + "@"
        );

        try {  
          await git.addRemote("heroku", git_url);
        } catch {
          console.log("heroku remote error");
        }
        await git.push("heroku", Config.BRANCH);

        await message.sendMessage("_Successfully updated_");
      }
    }
    await git.fetch();
    var commits = await git.log([Config.BRANCH + "..origin/" + Config.BRANCH]);
    if (commits.total === 0) {
      await message.sendMessage("_Already Updated_ ");
    } else {
      var availupdate = "*ᴜᴘᴅᴀᴛᴇs ᴀʀᴇ ᴀᴠᴀɪʟᴀʙʟᴇ* \n\n";
      commits["all"].map((commit, num) => {
        availupdate += num + 1 + " ❑ " + tiny(commit.message) + "\n";
      });
      return await message.client.sendMessage(message.jid, {
        text: availupdate,
        footer: tiny("click here to update"),
      });
    }
  }
);

command(
  {
    pattern: "update now",
    fromMe: true,
    type: "heroku",
    desc: "Updates the bot",
  },
  async (message) => {}
);
