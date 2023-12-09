
import { findByPropsLazy } from "@webpack";
import definePlugin, { OptionType } from "@utils/types";
import { ApplicationCommandInputType, ApplicationCommandOptionType, findOption, sendBotMessage, BUILT_IN, commands} from "@api/Commands";
import { MessageStore, UserStore } from "@webpack/common";
import { Message, Channel } from "discord-types/general";
import { MessageActions } from "@utils/discord";
const MessageDelete = findByPropsLazy("deleteMessage", "patchMessageAttachments");



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
        baddies: {
            name: "I will be a baddie",
            description: "If enabled I will become baddie",
            type: OptionType.BOOLEAN,
            default: true
        }
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
                    name: "test",
                    description: "Funny Test",
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    options: []
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
                    case "test": {
                        var fields: object[] = [{name: "raid_type", value: "DM_RAID", inline: false}, {name: "dms_sent", value: "5", inline: false}]
                        var embed = {
                            title: "Help Command",
                            description: "*Commands listed below*",
                            type: "auto_moderation_notification",
                            fields: fields
                        }
                        return sendBotMessage(ctx.channel.id, {
                            // @ts-ignore
                            embeds: [embed]
                        });
                    }
                    
                    case "help": {
                        var fields: object[] = []
                        var embed = {
                            title: "Help Command",
                            description: "*Commands listed below*",
                            type: "rich",
                            fields: fields
                        }
                        
                        Object.values(commands).forEach(cmd=>{
                            
                            if (cmd !== undefined) {
                                embed.fields.push({
                                    name: `**${cmd.name}**`,
                                    value: `*${cmd.description}*`
                                });
                            }
                        })
                        return sendBotMessage(ctx.channel.id, {
                            // @ts-ignore
                            embeds: [embed]
                        });
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

