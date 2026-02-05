import { jsx } from "@parchii/jsx";
import { render } from "@parchii/html";

const Function = (input, children) => {
	return <div>meow!</div>;
};

const dom = <div>
	oh wow <Function></Function>
</div>;

const str = render(dom);

console.log(str);

