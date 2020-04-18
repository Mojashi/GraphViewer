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
    mul(x){
        this.x *= x;
        this.y *= x;
    }
}

class Vertex  extends React.Component {
    render(){
        const center = this.props.center, r = this.props.r;
        return (
            <g fixed="false" onClick={this.props.onClick} onMouseUp={this.props.onMouseUp} onMouseDown={this.props.onMouseDown} style={{cursor: "pointer"}}>
               
                <circle cx={center.x} cy={center.y} r={r} fill={this.props.selected?"#302A62" : "#FFFFFF"} stroke="#1C1445" strokeWidth={2}></circle>
                <text x={center.x} y={center.y} fontSize="24" dominantBaseline="central" textAnchor="middle" style={{userSelect: "none"}} strokeWidth={2} stroke={!this.props.selected?"#302A62" : "#FFFFFF"} fill={!this.props.selected?"#302A62" : "#FFFFFF"}>{this.props.children}</text>
            </g>
        );
    }
}

class Edge extends React.Component {
    render(){
        const from = this.props.from, to = this.props.to;
        return (
            <g> 
                <path d={"M " + from.x + " " + from.y + " L " + to.x + " " + to.y} stroke="#1C1445" strokeWidth={2} ></path>
            </g>
        );
    }
}

class VertexInfo {
    constructor(id, pos){
        this.pos = new Point(pos.x,pos.y);
        this.id = id;
        this.text = this.id;
        this.velocity = new Point(0, 0);
        this.selected = false;
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
        this.updateVertexPos = this.updateVertexPos.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleViewBoxDragStart = this.handleViewBoxDragStart.bind(this);
        this.state = {
            vertices : [],
            timerId : null,
            dragBeforePos : null,
            draggingVertex : null,
            draggingViewBox : false,
            dragTimerId : null,
            originalBoxSize: new Point(0,0),
            viewBoxScale:1,
            viewBoxPos:new Point(0,0),
        };
    }
    componentDidMount(){
        const originalBoxSize = new Point(0,0);
        originalBoxSize.x += document.getElementById(this.props.id).clientWidth;
        originalBoxSize.y += document.getElementById(this.props.id).clientHeight;
        this.setState({timerId:setInterval(this.updateVertexPos, 50),
            originalBoxSize:originalBoxSize});
    }
    componentUnmount(){
        clearInterval(this.state.timerId);
    }
    updateVertexPos(){
        const coulomb = 10000.0, spring = 0.010, naturalLen = 200.0, deltaT = 1;
        const vertices = this.state.vertices, edges = this.props.edges;
        let fs = Array(vertices.length).fill(null);

        for(let i = 0; vertices.length > i; i++) fs[i] = new Point(0,0);
        for(let i = 0; vertices.length > i; i++){
            const v1 = vertices[i];
            for(let j = 0; vertices.length > j; j++){
                if(i === j) continue;
                const v2 = vertices[j],len=Math.sqrt(Math.pow(v1.pos.x - v2.pos.x,2) + Math.pow(v1.pos.y - v2.pos.y,2)),
                 f = coulomb / Math.max(100.0,len*len);
                fs[i].add(new Point(f * (v1.pos.x-v2.pos.x)/len,f * (v1.pos.y-v2.pos.y)/len));
            }
        }

        for(let i = 0; edges.length > i; i++){
            const v1 =vertices[edges[i].from], v2 = vertices[edges[i].to],
             len = Math.sqrt(Math.pow(v1.pos.x - v2.pos.x,2) + Math.pow(v1.pos.y - v2.pos.y,2)),
             f = spring * (len - naturalLen);
            fs[edges[i].to].add(new Point(f * (v1.pos.x-v2.pos.x)/len, f * (v1.pos.y-v2.pos.y)/len));
            fs[edges[i].from].add(new Point(f * (v2.pos.x-v1.pos.x)/len, f *(v2.pos.y-v1.pos.y)/len));
        }

        for(let i = 0; vertices.length > i; i++){
            if(this.state.draggingVertex === i) {
                vertices[i].velocity = new Point(0,0);
                continue;
            }
            vertices[i].velocity.add(new Point(deltaT*fs[i].x,deltaT*fs[i].y));
            vertices[i].velocity.mul(0.8);
            vertices[i].pos.add(new Point(deltaT*vertices[i].velocity.x,deltaT*vertices[i].velocity.y));
        }
        this.setState({
            vertices:vertices
        });
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
    handleWheel(e){
        console.log(e.deltaY);
        const deltaW = Math.sign(e.deltaY) * 0.1,viewBoxPos = this.state.viewBoxPos;
        this.setState({
            viewBoxScale:this.state.viewBoxScale + deltaW,
            viewBoxPos : new Point(viewBoxPos.x - this.state.originalBoxSize.x* deltaW / 2,viewBoxPos.y -  this.state.originalBoxSize.y*deltaW / 2)
        });
    }
    handleViewBoxDragStart(e){
        if(e.buttons & 1) {
            this.setState({draggingViewBox:true,dragBeforePos:new Point(e.pageX, e.pageY)});
        }
    }
    handleVertexDragStart(e, id){
        if(e.buttons & 1) {
            e.stopPropagation();
            this.setState({draggingVertex:id,dragBeforePos:new Point(e.pageX, e.pageY)});
        }
    }
    handleMouseUp(e, id){
        if(e.button === 2) {
            const vertices = this.state.vertices;
            vertices[id].selected = !vertices[id].selected;
            this.setState({vertices:vertices});
        }
    }
    handleMouseMove(e){
        if(this.state.draggingVertex !== null) {
            const nv = this.state.vertices.slice();
            const diff = new Point(e.pageX - this.state.dragBeforePos.x, e.pageY - this.state.dragBeforePos.y);
            diff.mul(this.state.viewBoxScale);
            nv[this.state.draggingVertex].pos.add(diff);

            this.setState({vertices: nv,dragBeforePos: new Point(e.pageX, e.pageY)});
        }
        if(this.state.draggingViewBox){
            const diff = new Point(e.pageX - this.state.dragBeforePos.x, e.pageY - this.state.dragBeforePos.y);
            const npos = this.state.viewBoxPos;
            diff.mul(this.state.viewBoxScale);
            npos.sub(diff);
            this.setState({viewBoxPos: npos,dragBeforePos: new Point(e.pageX, e.pageY)});
        }
    }
    handleReleaseVertex(e){
        this.setState({
            draggingViewBox: false,
            draggingVertex :null,
            dragBeforePos: null});
    }
    render(){
        const viewBoxStr = this.state.viewBoxPos.x + ", "+this.state.viewBoxPos.y + ", "+this.state.originalBoxSize.x*this.state.viewBoxScale + ", "+this.state.originalBoxSize.y*this.state.viewBoxScale;
        return (
            <svg id={this.props.id} viewBox={viewBoxStr} width="100%" height="100%" onScroll={(e)=>{e.preventDefault();}} onWheel={this.handleWheel} onMouseMove={this.handleMouseMove} onContextMenu={(e)=>{e.preventDefault();}} onMouseDown={this.handleViewBoxDragStart} onMouseUp={this.handleReleaseVertex} onMouseLeave={this.handleReleaseVertex}>
                {this.props.edges.map((ed)=> 
                    <Edge key={ed.id} from={this.state.vertices[ed.from].pos} to={this.state.vertices[ed.to].pos}/>
                )}
                {this.state.vertices.map((v)=> 
                    <Vertex key={v.id} center={v.pos} r={30} selected={v.selected} onMouseUp={(e)=>this.handleMouseUp(e,v.id)} onMouseDown={(e)=>this.handleVertexDragStart(e, v.id)}>{v.text}</Vertex>
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
            edges:[],
        }
        this.setRandomGraph = this.setRandomGraph.bind(this);
    }
    componentDidMount(){
        this.setRandomGraph();
    }
    setRandomGraph(){
        const edges = [], n = this.state.currentN, edNum = n * 1.5;
        
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
            <div style={{width:600 ,height:600 ,border:"2px solid black", borderRadius: "10px", marginTop: "30px", position: "relative"}}>
            <Graph id="graph0" nOfVertices={this.state.nOfVertices} edges ={this.state.edges} width={600} height={600}/>
            </div>
            </div>
        );
    }
}