import { jsx } from "@parchii/jsx";

export const CatpageRow = (input: {
	id: string;
	breed: string;
	name: string;
	rarity: string;
}) => {
	const thumb = input.name[0].toUpperCase();
	return (
		<div class="catpage--left--list--row">
			<div class="--thumb">{ thumb }</div>
			<div class="--main">
				<div class="--main--name">
					{ input.name }
				</div>
				<div class="--main--sub">
					{ input.breed } • { input.id }
				</div>
			</div>
			<span class="--pill pill">
				{ input.rarity }
			</span>
		</div>
	);
};
