import { jsx } from "@parchii/jsx";

export const CatPageLeft = () => {

};

export const CatpageRow = (input: {
	id: string;
	breed: string;
	name: string;
	rarity: string;
	link: string;
}) => {
	const thumb = input.name[0].toUpperCase();
	return (
		<a class="catpage--left--list--row" href={ input.link }>
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
		</a>
	);
};
