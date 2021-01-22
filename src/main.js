import { createElement, Component, render } from "./toy-react";

class Demo extends Component {
  render() {
    return <div>999</div>;
  }
}

const demo = <Demo />;

render(demo, document.querySelector("#root"));
