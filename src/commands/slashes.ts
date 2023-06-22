import { ApplicationCommandOptionType, CommandInteraction } from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import { Dex } from "pokemon-showdown";

@Discord()
export class Example {
	@Slash({ description: "ping" })
	ping(interaction: CommandInteraction): void {
		interaction.reply("pong!");
	}

	@Slash({ description: "Check a Pokemon for a list of moves."})
	check(
		@SlashOption({
			name: "pokemon",
			type: ApplicationCommandOptionType.String,
			required: true,
			description: "The Pokemon whose moveset to check.",
		})
		pokemon: string,
		@SlashOption({
			name: "checklist",
			type: ApplicationCommandOptionType.String,
			required: true,
			description: "A list of comma-separated moves to check in the Pokemon's moveset for."
		})
		checklist: string,
		@SlashOption({
			name: "detailed",
			type: ApplicationCommandOptionType.Boolean,
			required: false,
			description: "Whether or not the gathered info should be detailed. True by default."
		})
		detailed: boolean = true,
		ixn: CommandInteraction
	) {
		const species = Dex.species.get(pokemon)
		const moveset = Dex.species.getLearnset(species.id)
		if (! moveset) {
			ixn.reply(`Couldn't find a moveset for the Pokemon ${species.name}.`);
		} else {
			ixn.reply(
				"```diff\n" +
				checklist.split(",").map((s) => {
					const moveEntry = Dex.moves.get(s)
					if (moveEntry.id in moveset) {
						const methods: {[method: string]: string[]} = {}
						const methods_with_num: {[method: string]: {[num: string]: string[]}} = {}
						moveset[moveEntry.id].forEach((raw_method: string) => {
							const gen = raw_method[0]
							const method = ((abbr) => {
								switch (abbr) {
									case "L": return "Lvl"
									case "M": return "TM"
									case "E": return "Egg"
									case "T": return "Tutor"
									case "V": return "Transfer"
								}
								return abbr
							})(raw_method[1])

							const extra_num = raw_method.slice(2)
                            if (extra_num.length == 0) {
                                if (!(method in methods)) {
                                    methods[method] = []
                                }
                                methods[method].push(gen)
                            } else {
								if (!(method in methods_with_num)) {
									methods_with_num[method] = {}
								}
								if (!(extra_num in methods_with_num[method])) {
									methods_with_num[method][extra_num] = []
								}
								methods_with_num[method][extra_num].push(gen)
							}
						})
						const get_gens_str = (gens: string[]) => {
							let gens_str = gens[0];
							if (gens.length > 1) {
								gens_str = `${gens[gens.length-1]}-${gens[0]}`
							}
							return gens_str
						}
						const methods_str = detailed && (
							Object.entries(methods).map(([method, gens]) => {
								return `\n  ${method} in ${get_gens_str(gens)}`
							}).concat(Object.entries(methods_with_num).map(([method, nums]) => {
								return Object.entries(nums).map(([num, gens]) => {
									return `\n  ${method}${num} in ${get_gens_str(gens)}`
								}).join("")
							}))
						).join("") || Object.keys(methods).concat(Object.keys(methods_with_num)).join(", ")
						return `+ ${moveEntry.name}: ${methods_str}`
					}
					if (moveEntry.exists) {
						return `- ${moveEntry.name}`
					}
					return `- ${moveEntry.name} (Move not found)`
				}).join("\n") +
				"\n```"
			)
		}
	}
}
