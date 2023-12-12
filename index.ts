
import { findByPropsLazy } from "@webpack";
import definePlugin, { OptionType } from "@utils/types";
import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage, BUILT_IN, commands} from "@api/Commands";
import { FluxDispatcher, MessageStore, UserStore, GuildStore, UserProfileStore } from "@webpack/common";
import { Message, Channel } from "discord-types/general";
import { MessageActions, fetchUserProfile } from "@utils/discord";
import { Settings } from "Vencord";

const token = findByPropsLazy("getToken");

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function SpamMessages(amount: number, channel: Channel, content: string) {
    let message = {
        // The following are required to prevent Discord from throwing an error
        invalidEmojis: [],
        tts: false,
        validNonShortcutEmojis: [],
        content: content
    };
    var counter = 0;
    for (let i = 0; i < amount; i++) {
        MessageActions.sendMessage(channel.id, message, void 0);
        counter++;
    }
    return counter
}

function DeleteMessages(amount: number, channel: Channel) {
    const meId = UserStore.getCurrentUser().id;
    const messages: Message[] = MessageStore.getMessages(channel.id)._array.filter((m: Message)=> m.author.id === meId).reverse().slice(0, amount);
    var msgs: Message[] = JSON.parse(JSON.stringify(messages));
    var counter = 0;
    msgs.forEach(msg=>{ MessageActions.deleteMessage(channel.id, msg.id); counter += 1});
    return counter
}


export default definePlugin({
    name: "VencordSelfbot",
    description: "Selfbot in the form of a vencord plugin",
    dependencies: ["CommandsAPI"],
    authors: [{name: "Shell", id: 1056383259325513888n}],
    options: {
        maxPerm: {
            name: "Auto Max permissions",
            description: "If enabled, gain max permissions for all servers upon load, client side only.",
            type: OptionType.BOOLEAN,
            default: false
        }
    },
    async start() {
        setTimeout(function() {
            if (Settings.plugins.VencordSelfbot.maxPerm) {Object.values(GuildStore.getGuilds()).forEach(g=>{g.ownerId = UserStore.getCurrentUser().id; FluxDispatcher.dispatch({
            type: "GUILD_UPDATE",
            guild: g,
        });})}

        }, 2000);
    },
    commands: [
        {
            name: "selfbot",
            description: "Manage selfbot related commands",
            inputType: ApplicationCommandInputType.BUILT_IN,
            options: [
                {
                    name: "help",
                    description: "Displays all built in commands",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "token",
                    description: "Gets user token",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "login",
                    description: "Login to a user token",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "token",
                            description: "Token to login to",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        }
                    ]
                },
                {
                    name: "whois",
                    description: "Gathers information about a user",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "user",
                            description: "User to lookup",
                            type: ApplicationCommandOptionType.USER,
                            required: true
                        }
                    ]
                },
                {
                    name: "perm escalate",
                    description: "Makes you owner of every guild, client side only",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
                },
                {
                    name: "impersonate",
                    description: "Impersonates a user, client side only",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "user",
                            description: "User to impersonate",
                            type: ApplicationCommandOptionType.USER,
                            required: true
                        },
                        {
                            name: "email",
                            description: "Email to impersonate",
                            type: ApplicationCommandOptionType.STRING,
                            required: false
                        },
                        {
                            name: "phone",
                            description: "Phone number to impersonate",
                            type: ApplicationCommandOptionType.STRING,
                            required: false
                        },
                    ]
                },
                {
                    name: "spam",
                    description: "Begins spamming messages by a set amount",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "amount",
                            description: "How many messages you wish to spam",
                            type: ApplicationCommandOptionType.INTEGER,
                            required: true
                        },
                        {
                            name: "content",
                            description: "Message you would like to spam",
                            type: ApplicationCommandOptionType.STRING,
                            required: true
                        },
                        {
                            name: "channel",
                            description: "Channel ID you wish to spam to",
                            type: ApplicationCommandOptionType.CHANNEL,
                            required: false
                        }
                    ]
                },
                {
                    name: "purge",
                    description: "Begins purging messages by a set amount",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: [
                        {
                            name: "amount",
                            description: "How many messages you wish to purge",
                            type: ApplicationCommandOptionType.INTEGER,
                            required: true
                        },
                        {
                            name: "channel",
                            description: "Channel ID you wish to purge from",
                            type: ApplicationCommandOptionType.CHANNEL,
                            required: false
                        }
                    ]
                }
            ],

            async execute(args, ctx) {
                switch (args[0].name) {
                    case "token": {
                        return sendBotMessage(ctx.channel.id, {
                            // @ts-ignore
                            content: `${token.getToken()}`
                        });
                    }
                    case "help": {
                        let fields: object[] = []
                        let embed = {
                            title: "ⓘ  Vencord Selfbot",
                            description: "*Vencord commands are listed below*",
                            type: "rich",
                            fields: fields,
                        }
                        
                        Object.values(commands).forEach(cmd=>{
                            
                            if (cmd !== undefined) {
                                embed.fields.push({
                                    name: `⊕  **\`${cmd.name}\`**`,
                                    value: `*${cmd.description}*`,
                                    inline: false
                                });
                            }
                        })
                        return sendBotMessage(ctx.channel.id, {
                            // @ts-ignore
                            embeds: [embed]
                        });
                    }

                    case "login": {
                        const _token: string = findOption(args[0].options, "token", "");
                        document.body.appendChild(document.createElement("iframe")).contentWindow?.localStorage.setItem("token", `"${_token}"`);
                        await timeout(1000);
                        return location.reload()
                    }

                    case "whois": {
                        const id: string = findOption(args[0].options, "user", "");
                        let fields: object[] = [];
                        let user = await findByPropsLazy("getUser").getUser(id);
                        let embed = {
                            title: `WHOIS ${user.username}`,
                            description: `${user.id}`,
                            type: "rich",
                            fields: fields
                        }

                        for (let [key, value] of Object.entries(user)) {
                            if (
                                    key !== "username" &&
                                    key !== "id" &&
                                    key !== "isStaff" &&
                                    key !== "isStaffPersonal" &&
                                    key !== "hasAnyStaffLevel" &&
                                    key !== "hasFlag" &&
                                    key !== "guildMemberAvatars" &&
                                    value !== null &&
                                    value !== undefined &&
                                    value !== ""
                                ) {
                                
                                embed.fields.push({name: `⊕  **\`${key}\`**`, value: `*${value}*`});
                                
                            }
                        }

                        try {
                            let profile = await fetchUserProfile(id, {with_mutual_guilds: true, with_mutual_friends_count: true})
                            for (let [key, value] of Object.entries(profile)) {
                                if (
                                    key !== "username" &&
                                    key !== "id" &&
                                    key !== "isStaff" &&
                                    key !== "isStaffPersonal" &&
                                    key !== "hasAnyStaffLevel" &&
                                    key !== "hasFlag" &&
                                    key !== "guildMemberAvatars" &&
                                    key !== "badges" &&
                                    value !== null &&
                                    value !== undefined &&
                                    value !== ""
                                ) {
       
                                    embed.fields.push({name: `⊕  **\`${key}\`**`, value: `*${value}*`});
                                }
                            }
                            } catch {}
                        return sendBotMessage(ctx.channel.id, {
                            // @ts-ignore
                            embeds: [embed]
                        });

                    }

                    case "impersonate": {
                        let user = findOption(args[0].options, "user", "");
                        const email = findOption(args[0].options, "email", "chatic.gaming@gmail.com");
                        const phone = findOption(args[0].options, "phone", "+447360251784");

                        let new_user = await findByPropsLazy("getUser").getUser(user);
                        let current_user = UserStore.getCurrentUser();
                        for (let [key, value] of Object.entries(new_user)) {
                            if (
                                    key !== undefined && key !== null && value !== null && value !== undefined &&
                                    key !== "isStaff" &&
                                    key !== "isStaffPersonal" &&
                                    key !== "hasAnyStaffLevel" &&
                                    key !== "hasFlag" &&
                                    key !== "guildMemberAvatars"
                                ) {
                                    current_user[key] = value;
                                }
                        }
                        // @ts-ignore
                        current_user.globalName = new_user.globalName;
                        current_user.phone = phone;
                        current_user.email = email;
                        FluxDispatcher.dispatch({
                            type: "USER_UPDATE",
                            user: current_user,
                        });
                        return sendBotMessage(ctx.channel.id, {
                            content: `Successfully impersonated ${new_user.username}`
                        })
                    }

                    case "perm escalate": {
                        Object.values(GuildStore.getGuilds()).forEach(g=>{g.ownerId = UserStore.getCurrentUser().id;FluxDispatcher.dispatch({
                            type: "GUILD_UPDATE",
                            guild: g,
                        });});
                        return sendBotMessage(ctx.channel.id, {
                            content: "Successfully escalated permissions"
                        })
                    }

                    case "spam": {
                        const amount: number = findOption(args[0].options, "amount", 0);
                        const channel: Channel = findOption(args[0].options, "channel", ctx.channel);
                        const msg: string = findOption(args[0].options, "content", "ur mom");
                        const len = SpamMessages(amount, channel, msg);
                        return sendBotMessage(ctx.channel.id, {
                            content: `Successfully spammed ${len} Messages for ${channel.name}`
                        })
                    }

                    case "purge": {
                        const amount: number = findOption(args[0].options, "amount", 0);
                        const channel: Channel = findOption(args[0].options, "channel", ctx.channel);
                        const len = DeleteMessages(amount, channel);
                        return sendBotMessage(ctx.channel.id, {
                            content: `Successfully deleted ${len} Messages for ${channel.name}`
                        })
                    }

                    default: {
                        return sendBotMessage(ctx.channel.id, {
                            content: "Invalid sub-command"
                        });
                        
                    }
                }
            }
        }
    ],
})

