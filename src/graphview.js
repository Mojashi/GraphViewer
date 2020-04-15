import React from 'react';
import ReactDOM from 'react-dom';

class Point {
    constructor(x, y){
        this.x = x;
        this.y = y;
    }
    add(p){
        this.x += p.x;
        this.y += p.y;
    }
    sub(p){
        this.x -= p.x;
        this.y -= p.y;
    }
}

class Vertex  extends React.Component {
    render(){
        const center = this.props.center, r = this.props.r;
        return (
            <g fixed="false" onMouseDown={this.props.onMouseDown} style={{cursor: "pointer"}}>
                <circle cx={center.x} cy={center.y} r={r} fill="white" stroke="black" strokeWidth={2}></circle>
                <text x={center.x} y={center.y} fontSize="24" dominantBaseline="central" textAnchor="middle" style={{userSelect: "none"}} strokeWidth={1} stroke="black" fill="black">{this.props.children}</text>
            </g>
        );
    }
}

class Edge extends React.Component {
    render(){
        const from = this.props.from, to = this.props.to;
        return (
            <g>
                <path d={"M " + from.x + " " + from.y + " L " + to.x + " " + to.y} stroke="black" strokeWidth={2}></path>

            </g>
        );
    }
}

class VertexInfo {
    constructor(id, pos){
        this.pos = new Point(pos.x,pos.y);
        this.id = id;
        this.text = this.id;
    }
}

class EdgeInfo {
    constructor(id, from, to){
        this.from = from;
        this.to = to;
        this.id = id;
        this.text = "";
    }
}

function getRandomInt(min, max){ // [l,r]
    return Math.floor(Math.random() * (max - min)) + min;
}

function isEqualArray(a,b){
    return a.length === b.length && a.every(function(value, index) { return value === b[index]});
}

class Graph extends React.Component {
    constructor(props){
        super(props);
        this.handleVertexDragStart = this.handleVertexDragStart.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleReleaseVertex = this.handleReleaseVertex.bind(this);

        this.state = {
            vertices : [],
            dragBeforePos : null,
            draggingVertex : null,
            dragTimerId : null
        };
    }
    static getRandomVertexPos(nOfVertices, width, height){
        const vertices = [];
        for(let i = 0; nOfVertices > i; i++){
            vertices.push(new VertexInfo(i,new Point(getRandomInt(0,width),getRandomInt(0,height))));
        }
        return vertices;
    }
    static getDerivedStateFromProps (nextProps,prevState){
        if(nextProps.nOfVertices == prevState.vertices.length) return;
        return {vertices:Graph.getRandomVertexPos(nextProps.nOfVertices, nextProps.width, nextProps.height)};
    }
    handleVertexDragStart(e, i){
        this.setState({draggingVertex:i});
        this.setState({dragBeforePos:new Point(e.pageX, e.pageY)});
    }
    handleMouseMove(e){
        if(this.state.draggingVertex === null) return;
        console.log("dragging : "  + this.state.draggingVertex);
        const nv = this.state.vertices.slice();
        const diff = new Point(e.pageX - this.state.dragBeforePos.x, e.pageY - this.state.dragBeforePos.y);
        nv[this.state.draggingVertex].pos.add(diff);

        this.setState({vertices: nv});
        this.setState({dragBeforePos: new Point(e.pageX, e.pageY)});
    }
    handleReleaseVertex(){
        this.state.draggingVertex = null;
        this.setState({dragBeforePos: null});
    }
    render(){
        return (
            <svg width="100%" height="100%" onMouseMove={this.handleMouseMove} onMouseUp={this.handleReleaseVertex} onMouseLeave={this.handleReleaseVertex}>
                {/* <Edge from={new Point(20,20)} to={new Point(170,170)}/> */}
                <defs>
    <pattern id="star" viewBox="0,0,10,10" width="10%" height="10%">
      <polygon points="0,0 2,5 0,10 5,8 10,10 8,5 10,0 5,2"/>
    </pattern>
  </defs>
                {/* <rect x="0" y="0" width="100%" height="100%" fill="url(#star)"/> */}
                {this.props.edges.map((ed)=> 
                    <Edge key={ed.id} from={this.state.vertices[ed.from].pos} to={this.state.vertices[ed.to].pos}/>
                )}
                {this.state.vertices.map((v)=> 
                    <Vertex key={v.id} center={v.pos} r={30} onMouseDown={(e)=>this.handleVertexDragStart(e, v.id)}>{v.text}</Vertex>
                )}
            </svg>
        );
    }
}
function uniq(array) {
    return [...new Set(array)];
}
export default class GraphView extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            currentN:5,
            nOfVertices:5,
            edges:[]
        }
        this.setRandomGraph = this.setRandomGraph.bind(this);
    }
    componentDidMount(){
        this.setRandomGraph();
    }
    setRandomGraph(){
        const edges = [], n = this.state.currentN, edNum = n * (getRandomInt(n/3,n/2));
        
        for(let i = 0; edNum > i; i++){
            const from = getRandomInt(1,n);
            edges.push( new EdgeInfo(i, from, getRandomInt(0,from)) );
        }
        this.setState({
            nOfVertices: this.state.currentN,
            edges : uniq(edges)
        })

    }
    render(){
        return(
            <div>
            <label>
              Num of vertices:
             <input type="number" value={this.state.currentN} name="nOnVertices" onChange={(e)=>{this.setState({currentN:e.target.value})}}/>
            </label>
            <button onClick={this.setRandomGraph}>Generate New Graph</button>

            <div style={{width:600 ,height:600 ,border:"1px solid black"}}>
            <Graph nOfVertices={this.state.nOfVertices} edges ={this.state.edges} width={600} height={600}/>
            </div>
            </div>
        );
    }
}