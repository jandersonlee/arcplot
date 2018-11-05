// to avoid global namespace pollution use "ap" or "AP" prefix
// v0.4: add Sync and AutoMark fixes
var apPrefix = "AP";
var APversion = 0.3;
function apId(id) { return apPrefix+id; }
function byId(id) { return document.getElementById(id); }
function apById(id) { return byId(apId(id)); }
var apBoosterTitle = "Arc Plot Interface";
var apBoosterDivName = apId("Div");
var apBoosterDivSelector = "#" + apBoosterDivName;
var apDebug = 1;
var apInstalled = false;
var apStub = (byId(apId('Stub')) ? true : false);

// Hold off the script timeout for an hour.
function apDefer() {
  if (!apStub) global_timer.setHours( global_timer.getHours() + 1);
}
apDefer();

function apGetById(id) {
  var elem = apById(id);
  if (elem) return elem.value;
  return null;
}

function apSetById(id,val) {
  val = val || '';
  var elem = apById(id);
  if (elem) return elem.value = val.toString();
}

var ntColors = {'A': '#EE0', 'C': '#080', 'G': '#C00', 'U': '#33F'}
function colorForC(c) {
  if (typeof(ntColors[c]) != "undefined") {
    return ntColors[c];
  }
  return "#fff"
}

var apFEBase = 5.27;
var apFELog = Math.log(apFEBase);
function apFEToWeight(fe) { return Math.pow(apFEBase,-fe); }
function apProbToFE(p) { return -Math.log(p)/apFELog; }

// a list of the aptamers to recognize
var apAptamers = [
  {'id': 'FMN',
   'S1': '..AGGAUAU.',
   'C1': '((......((',
   'S2': '.AGAAGG..',
   'C2': ')).....))'},
  {'id': 'Tryptophan',
   'S1': 'CGCCACU',
   'C1': '((...((',
   'S2': 'AGGACCG',
   'C2': '))...))'},
  {'id': 'Theophylline',
   'S1': '.GAUACCAG.',
   'C1': '((...(((((',
   'S2': '.CCCUUGGCAGC.',
   'C2': '))...)))...))'},
  {'id': 'Tetracycline',
   'S1': '.UAAAACAUACC',
   'C1': '((........((',
   'S2': 'GGAGAGGUGAAGAAUACGACCACCUA.',
   'C2': '))..(((((...........)))))))'}
];

// a list of reporter sites to recognize
var apReporters = [
  {'id': 'MS2',
   'S1': 'ACAUGAGGAUCACCCAUGU',
   'C1': '(((((.((....)))))))'},
  {'id': 'MGA',
   'S1': '.GGUAACGAAUG.',
   'C1': '((....((...((',
   'S2': '.CCGAC.',
   'C2': ')))).))'},
  {'id': 'Spinach',
   'S1': '.GUUGAGUAGAGUGUGAGC.',
   'C1': '((..((.....((.(...((',
   'S2': '.GAAGGACGGGUCC.',
   'C2': '))..).))...))))'},
  {'id': 'MS2-ALT1',
   'S1': "ACAUGAGCAUCAGCCAUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT2',
   'S1': "ACACGAGGAUCACCCGUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT3',
   'S1': "ACAAGAGGAUCACCCUUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT4',
   'S1': "ACAGGAGGAUCACCCCUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT5',
   'S1': "ACCUGAGGAUCACCCAGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT6',
   'S1': "ACCUGAGGAACACCCAGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT7',
   'S1': "ACCUGAGGAUCACCCGGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT8',
   'S1': "ACCUGAGGAUCACCCUGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT9',
   'S1': "ACGUGAGGAUCACCCACGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT10',
   'S1': "ACUUGAGGAUCACCCAAGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT11',
   'S1': "ACUUGAGGAACACCCAAGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT12',
   'S1': "ACUUGAGGAUCACCCAGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT13',
   'S1': "AGAUGAGGAUCACCCAUCU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT14',
   'S1': "AUAUGAGGAUCACCCAUAU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT15',
   'S1': "AUCUGAGGAUCACCCAGGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT16',
   'S1': "CCAUGAGGAUCACCCAUGG",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT17',
   'S1': "GCAUGAGGAUCACCCAUGC",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT18',
   'S1': "GCAUGAGGAUCACCCAUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT19',
   'S1': "GCAUGAGGAACACCCAUGC",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT20',
   'S1': "GCACGAGGAUCACCCGUGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT21',
   'S1': "GCGUGAGGAUCACCCAUGC",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT22',
   'S1': "GCUUGAGGAUCACCCAAGU",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT23',
   'S1': "UCAUGAGGAUCACCCAUGA",
   'C1': '(((((.((....)))))))'},
  {'id': 'MS2-ALT24',
   'S1': "UCAUGAGGAUCACCCAUGG",
   'C1': '(((((.((....)))))))'},
];

// Don't want multiple instances
if (byId(apBoosterDivSelector)) {
  //alert ( apBoosterTitle + " is already installed" );
  apInstalled = true;
};

function apPollNextState( callback, timeout ) {
  setTimeout( callback, timeout );
  return null;
}

// terminate the async action
var apDone = function() {
}

// placeholder for booster UI state/context
function APState() {
  this.seq = "";
  this.txt = "";
  this.conf = {};
  this.docs = [];
  this.selXY = {'x': 0, 'y': 0};
  this.index = 0;
  this.fsm = "done";
  this.frozen = false;
  this.autosync = true;
  this.applet = document.getElementById('maingame');
  // for dragging
  this.dragging = false;
  this.drag0 = {};
  this.drag1 = {};
  // for undo/redo
  this.delta ={};
  this.undo = [];
  this.redo = [];
  if (!this.applet) {
    console.log("cannot find maingame");
  }

  this.getconf = function() {
    var c = apGetById('Config') || '';
    c = c.split('\n');
    if (apDebug>1) console.log('getconf: c='+c);
    var conf = {};
    for (var i=0; i<c.length; i++) {
      var m = c[i].match(/([^:]*): (.*)/);
      if (m) {
        conf[m[1]] = m[2];
      }
    }
    this.conf = conf;
  };

  this.setconf = function () {
    var keys = Object.keys(this.conf).sort();
    var rows = [];
    for (var i=0; i<keys.length; i++) {
      var k = keys[i];
      rows.push(k+": "+this.conf[k].toString());
    }
    var yconf = rows.join('\n');
    apSetById('Config', yconf);
  };

  this.getval = function(id,defval) {
    var elem = apById(id);
    if (elem) return elem.value || this.conf[id] || defval || null;
    return this.conf[id] || defval || "";
  };

  this.setval = function(id,val) {
    var elem = apById(id);
    val = val || '';
    if (elem) { elem.value = val.toString(); }
    this.conf[id] = val.toString();  // also record state in the config
  };

  this.getState = function(pullseq) {
    pullseq = pullseq || this.autosync;
    if (apDebug>1) console.log("enter getState");
    this.getconf();
    if (pullseq) this.seq = this.get_sequence_string();
    else this.seq = (this.dm ? this.dm.seq : "");
    if (apDebug>1) { console.log("got seq="+this.seq); }
    this.len = this.seq.length;
    this.txt = this.getval('Notes') || '';
    if (apDebug>2) console.log("leave getState");
    return null;
  };

  this.setState = function(pushseq) {
    pushseq = pushseq || this.autosync;
    // called to reset the Plot state after an operation
    if (apDebug>0) { console.log("enter setState"); }
    if (this.seq && this.seq != this.get_sequence_string()) {
      if (pushseq) this.set_sequence_string( this.seq );
    }
    apSetById("Notes", this.txt || '');
    this.setconf();
    if (apDebug>1) { console.log("leave setState"); }
    return null;
  };

  return this;
}

APState.prototype.addNote = function(txt) {
  this.note = txt;
  apById('note').innerHTML = txt;
}

// use HTML document rendering to display debugging notes below the canvas
APState.prototype.addNote2 = function(txt) {
  this.note2 = txt;
  apById('note2').innerHTML = txt;
}

function rnd2(n,lpad) {
  var n2 = Math.round(n*100)/100.0;
  if (!lpad || lpad<0) return n2;
  var sn2 = n2.toString();
  if (!sn2.match(/\./)) sn2 = sn2.concat('.00');
  while (!sn2.match(/\.../)) sn2 = sn2.concat('0');
  while (sn2.length < lpad) sn2 = ' '.concat(sn2);
  return sn2;
}

function apPadH(s,n) {
  while (s.length < n) s = s.concat(' ');
  return s.replace(/ /g, '&nbsp;');
}

function rnd2html(n,lpad) {
  return rnd2(n,lpad||1).replace(/ /g,'&nbsp;');
}

APState.prototype.make_cmap = function (colors) {
  colors = colors || '#000000 #666666 #999999 #CCCCCC'
  var cmap = colors.split(/ +/);
  for (var n=0; n<cmap.length; n++) {
    var c = cmap[n];
    if (c[0]!='#') c = '#'+c;
    if (c.length==4) c = ['#',c[1],c[1],c[2],c[2],c[3],c[3]].join('')
    cmap[n] = c;
  }
  if (cmap.length==0) cmap=['#000000']
  var nbins=Math.min(cmap.length,Number(this.getval('bins','60')));
  cmap.length = nbins;
  this.setval('cmap',cmap.join(' '));
  var binsize = Number(this.getval('binsize','1'));
  binsize = Math.min(10,Math.max(0.01,binsize))
  this.binsize = binsize;
  this.setval('binsize',rnd2(this.binsize))
  console.log("bins="+cmap.length+" binsize="+this.binsize);
  this.cmap = cmap;
  return cmap;
}

APState.prototype.colorof = function (p) {
  var fe = apProbToFE(p);
  var n = Math.floor(fe/this.binsize);
  if (apDebug>1) console.log('p='+p+' fe='+fe+' n='+n);
  if (!this.cmap || n>this.cmap.length) return null;
  return this.cmap[n];
}

// make an array of 3-element arrays from a pairing_probabilities result
function apMakePlis(pairprob) {
  pairprob = pairprob || [];
  var n = Math.floor(pairprob.length/3);
  var plis = new Array(n);
  for (var i=0; i<n; i++) {
    var i3 = i*3;
    plis[i]=[Number(pairprob[i3]),Number(pairprob[i3+1]),Number(pairprob[i3+2])];
  }
  return plis;
}

function DotPlotShape(apc, seq, con, plis) {
  if (apDebug>1) console.log('new DotPlotShape');
  if (apDebug>1 && seq) console.log('seq='+seq);
  if (apDebug>1 && con) console.log('con='+con);
  if (apDebug>1 && plis) console.log('plis.length='+plis.length);
  this.apc = apc;
  this.seq = seq;
  this.con = con;
  var maxbase = seq.length;
  if (plis==null && !apStub) {
    if (apDebug>0) console.log('make plis');
    var pprob = [];
    if (con) console.log('con="'+con+'"');
    if (con) pprob = apc.pairing_probabilities(seq,con);
    else pprob = apc.pairing_probabilities(seq);
    if (apDebug>1) console.log('pprob=['+pprob+']');
    plis = apMakePlis(pprob);
    if (apDebug>1) console.log('plis='+plis);
  }
  plis = plis || [];
  while (plis.length>0 && plis[plis.length-1].length!=3) {
    plis.length = plis.length-1;
  }
  plis.sort(function(a, b){return a[2] - b[2]});
  this.plis = plis;
  if (apDebug>1) console.log('make pprows maxbase='+maxbase);
  var pprows = new Array(maxbase+1);
  for (var r=0; r<pprows.length; r++) {
    var row = new Array(maxbase+1);
    //console.log(' r='+r+' row.length='+row.length);
    for (var c=0; c<row.length; c++) row[c]=0.0;
    pprows[r] = row;
  }
  if (apDebug>0) console.log('fill pprows '+plis.length);
  for (i=0; i<plis.length; i++) {
    var pp = plis[i];
    if (pp.length==3) {
      pprows[pp[0]][pp[1]] = pp[2];
      pprows[pp[1]][pp[0]] = pp[2];
      if (apDebug>2) console.log('x= '+pp[0]+' y='+pp[1]+' p='+pp[2]);
    }
  }
  for (var r=1; r<pprows.length; r++) {
    var row = pprows[r];
    var sum = 0.0;
    for (var c=1; c<row.length; c++) sum = sum + row[c];
    pprows[0][c] = Math.max(0.0,1.0-sum);
  }
  this.pprows = pprows;
  if (apDebug>1) console.log('leaving DotPlotShape');
  return this;
}

// add in an unconstrained base state for bonus offset
DotPlotShape.prototype.aptBonus = function ( dp1, feBonus ) {
  feBonus = feBonus || 4.86;
  var b = apFEToWeight(-feBonus);
  var pp1 = dp1.pprows;
  var pp2 = this.pprows;
  if (pp1.length!=pp2.length) return;
  var scale = 0.0;
  for (var r=1; r<pp2.length; r++) {
    var row1 = pp1[r];
    var row2 = pp2[r];
    var sum = pp1[0][r];
    for (var c=1; c<row2.length; c++) {
       row2[c] = row2[c]*b + row1[c];
       sum += row2[c];
    }
    scale = Math.max(scale,sum);
  }
  if (apDebug>0) console.log('aptBonus: b='+b+' scale='+scale);
  for (var r=0; r<pp2.length; r++) {
    var row2 = pp2[r];
    var sum = 0.0;
    for (var c=1; c<row2.length; c++) {
      row2[c]/=scale;
      sum += row2[c];
    }
    pp2[0][c] = 1.0 - Math.min(1.0,sum);
  }
}

// holds the model specific metadata for a lab
// i.e. constrained bases, target shape constraints, ...
function LabModel(apc) {
  this.apc = apc;
  return this;
}

// converts a (.)- aptamer/constrain string to a match array
function parseConstrain(constrain) {
  // uses (.)- for constraints where - is "don't care"
  if (!constrain) return null;
  var match = new Array();
  match.length = constrain.length;
  var stack = new Array();
  var sp = 0;
  for (var i = 0; i<constrain.length; i++) {
    var c = constrain[i];
    if (c=='.') {
      match[i] = 0;  // unbonded
    } else if (c=='-') {
      match[i] = -1; // don't care
    } else if (c=='(') {
      match[i] = 0;  // pair 5' end
      stack[sp]=i+1;
      sp++;
    } else if (c==')') {
      if (sp>0) {    // pair 3' end
        sp--;
        match[i] = stack[sp];
        match[stack[sp]-1] = i+1;
      } else {
        apc.addNote("stack error in parseConstrain");
      }
    } else {
      apc.addNote("char error in parseConstrain");
      return [];
    }
  }
  return match;
}

// A ConstrainShape is a structure description
// initialize by converting a (.)- aptamer string to a structure
function ConstrainShape(apc, constrain, mfe, bonus) {
  this.apc = apc; // must specify!!!
  this.mfe = mfe || 0.0;
  this.bonus = bonus || (constrain ? -4.86 : 0.0);
  this.cons = constrain || ''; // uses (.)?
  this.match = parseConstrain(constrain);
  return this;
}

ConstrainShape.prototype.matches = function (shape2) {
  var m1 = this.match;
  var m2 = shape2.match;
  if ( m1==null || m2==null || m1==m2 ) return true;
  if (m1.length != m2.length) return false;
  for (var i=0; i<m1.length; i++) {
    if (m1[i]!=-1 && m2[i]!=-1 && m1[i]!=m2[i]) return false;
  }
  return true;
}

function ViewPort(apc,canvas) {
  this.apc = apc;
  this.canvas = canvas;
  this.width = canvas.width;
  this.height = canvas.height;
  this.ctx = canvas.getContext('2d');
  // This complicates things a little but but fixes mouse co-ordinate problems
  // when there's a border or padding. See getMouse for more detail
  var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    this.stylePaddingLeft = parseInt(
      document.defaultView.getComputedStyle(canvas,null)['paddingLeft'],10)||0;
    this.stylePaddingTop  = parseInt(
      document.defaultView.getComputedStyle(canvas,null)['paddingTop'],10)||0;
    this.styleBorderLeft  = parseInt(
      document.defaultView.getComputedStyle(canvas,null)['borderLeftWidth'],10) ||0;
    this.styleBorderTop   = parseInt(
      document.defaultView.getComputedStyle(canvas,null)['borderTopWidth'],10)||0;
  }
  // Some pages have fixed-position bars (like the stumbleupon bar)
  // at the top or left of the page. They will mess up mouse coordinates
  // and this fixes that
  var html = document.body.parentNode;
  this.htmlTop = html.offsetTop;
  this.htmlLeft = html.offsetLeft;

  // **** Then events! ****

  // This is an example of a closure! Right here "this" means the
  // ViewPort. But we are making events on the canvas itself, and
  // when the events are fired on the canvas the variable "this"
  // is going to mean the canvas! Since we still want to use this
  // particular ViewPort in the events we have to save a reference
  // to it. This is our reference!
  var myVP = this;

  //canvas.addEventListener('selectstart', function(e) {
  //  //fixes a problem where double clicking causes text
  //  // to get selected on the canvas
  //  e.preventDefault(); return false;
  //}, false);
  // Up, down, and move are for dragging
  canvas.addEventListener('click', function(e) {
    e.preventDefault();
    if (myVP.onclick) return myVP.onclick(e);
    return true;
  }, true);
  canvas.addEventListener('mousemove', function(e) {
    if (myVP.onmousemove) return myVP.onmousemove(e);
  }, true);
  canvas.addEventListener('mouseup', function(e) {
    if (myVP.onmouseup) return myVP.onmouseup(e);
  }, true);
  var cdiv = apById('CanvasDiv');
  if (cdiv) {
    canvas.addEventListener('keypress', function(e) {
      if (myVP.onkeypress) myVP.onkeypress(e);
      return true;
    }, true);
    canvas.addEventListener('mouseover', function(e) {
      // kludge: grab the keyboard focus whenever the window is entered
      console.log('mouseover');
      canvas.focus({preventScroll: true});
      if (myVP.onmouseover) return myVP.onmouseover(e);
      if (myVP.apc.autosync) return myVP.apc.onSync();
    }, true);
    canvas.addEventListener('mouseleave', function(e) {
      // kludge: grab the keyboard focus whenever the window is entered
      console.log('mouseleave');
      myVP.apc.applet.focus({preventScroll: true});
    }, true);
  }
  this.valid = true;
  this.interval = 100;
  //setInterval(function() { myVP.draw(myVP.ctx); }, this.interval);
}

ViewPort.prototype.layoutPanes = function() {
  var x=0, y=0, w=this.canvas.width, h=this.canvas.height;
  // for the moment there is one square pane: this.apc.dv
  var dw = Math.min(w,h);
  var dh = dw;
  if (this.apc && this.apc.dv) this.apc.dv.fitWithin(x,y,dw,dh);
  this.valid = false;
}

ViewPort.prototype.draw = function() {
  // if our state is invalid, redraw and validate!
  if (this.apc && this.apc.dv && !this.apc.dv.valid) this.valid = false;
  if (!this.valid && !this.drawBusy) {
    this.valid = true;
    this.drawBusy=true;
    var ctx = this.ctx;
    // ** Add stuff you want drawn in the background all the time here **
    ctx.fillStyle = "#888"
    ctx.fillRect(0,0,this.width,this.height)
    // for the moment there is one square pane
    if (this.apc && this.apc.dv) this.apc.dv.draw(this.ctx);
    // set drawing as valid
    this.drawBusy = false;
  }
}

// on entry, reset the sequence
ViewPort.prototype.onkeypress = function(e) {
  var c = e.key;
  if (apDebug>0) console.log('onkeypress: '+c);
  var op = (c>' ' && c<='~' && c.length==1 ? c : '?')
  this.apc.getState();
  if (op>='1' && op<='9') {
    var stamp = this.apc.getval('R'+op) || 'ACAUGAGGAUCACCCAUGU/MS2';
    this.apc.setval('R0',stamp);
    op = '0';
    this.apc.op = op;
    this.apc.setval('op',op);
  }
  else if (op=='<') this.apc.doUndo();
  else if (op=='>') this.apc.doRedo();
  else if (op=='s') this.apc.doStyle('next');
  else if (op=='v') this.apc.doView('next');
  else {
    this.apc.op = op;
    this.apc.setval('op',op);
  }
  this.apc.setState();
}

// on entry, reset the sequence
ViewPort.prototype.onmouseover = function(e) {
  //this.apc.seq = this.apc.get_sequence_string();
  //if (this.apc && this.apc.dm) this.apc.dm.setseq( this.apc.seq );
  return true;
}

// on motion, check the annotation
ViewPort.prototype.onmousemove = function(e) {
  var apc = this.apc;
  var mouse = this.getMouse(e);
  var mx = mouse.x;
  var my = mouse.y;
  if ((e.ctrlKey || e.shiftKey) && apc.dv) {
    // get xy in the active DesignView
    apc.selXY = apc.dv.calcXY(mx,my);
    apc.dv.renote2();
  }
  if (this.apc.dragging){
    // We don't want to drag the object by its top-left corner, we want
    // to drag it from where we clicked. Thats why we saved the offset
    // and use it here
    this.drag = {};
    this.drag.x = mouse.x - myState.dragoffx;
    this.drag.y = mouse.y - myState.dragoffy;
    this.valid = false; // Something's dragging so we must redraw
  }
  return true;
}

// on motion, check the annotation
ViewPort.prototype.onclick = function(e) {
  var apc = this.apc;
  var mouse = this.getMouse(e);
  var mx = mouse.x;
  var my = mouse.y;
  var op = apc.getval("op");
  if (apc.dv && apc.dv.contains(mx,my)) {
    // get xy in the active DesignView
    var action = (e.shiftKey?'shift-click':(e.ctrlKey?'ctrl-click':'click'));
    apc.dv.doOp(op,mx,my,action);
  }
  return true;
}

function DesignDoc(obj) {
  this.obj = obj || {};
  return this;
}
DesignDoc.prototype.toString = function () {
   var obj = this.obj || {};
   var keys = Object.keys(obj).sort();
   return ('---\n' +
           keys.map(function(k){return k+': '+obj[k].toString();}).join('\n')+
           '\n');
}

// holds the model specific metadata for a design
function DesignModel(apc,seq,lab) {
  this.apc = apc;
  this.seq = seq;
  this.lab = lab||null;
  this.me1 = 0.0; // mfe for state 1
  this.me2 = 0.0; // mfe for state 2 (no bonus)
  this.ns1 = null; // mfe (natural) shape str for state 1
  this.ns2 = null; // mfe (natural) shape str for state 2
  this.rep = null; // reporter site 
  this.apt = null; // aptamer site for state2
  this.con = null; // aptamer constraint for state2
  this.pp1 = null; // pairing probabilities for state 1
  this.pp2 = null; // pairing probabilities for state 2 (with bonus)
  this.dp1 = null; // dotplot for state 1
  this.dp2 = null; // dotplot for state 2
  this.changed = true;
  this.viewers = {}; // who to notify of changes
  this.noInterest = function (viewer) { 
    delete this.viewers[viewer];
    return this;
  }
  this.addInterest = function (viewer,cb) { 
    if (cb) this.viewers[viewer] = cb;
    else delete this.viewers[viewer];
    return this;
  }
  return this;
}

DesignModel.prototype.notifyIfChanged = function (force) {
  if (this.changed || force) {
    // call interested parties to notify them of changes
    this.changed = false;
    var viewers = this.viewers;
    var cbs =  Object.keys(viewers).map(function(k){return viewers[k];})
    for (var n=0; n<cbs.length; n++) {
      if (cbs[n]) cbs[n](this);
    }
  }
  return this;
}

DesignModel.prototype.setval = function (id,val) {
  return this.apc.setval(id,val);
}

// the shapes, mfe, pairing probabilities, for state2
DesignModel.prototype.setState2 = function (res) {
  this.ns2 = res.ns;
  if (apDebug>1) console.log('setState2: ns2='+this.ns2)
  this.me2 = res.mfe;
  if (apDebug>1) console.log('setState2: me2='+this.me2)
  this.dp2 = new DotPlotShape(this.apc,res.seq,res.con,res.plis);
  if (apDebug>1) console.log('setState2: plis.length='+res.plis.length)
  this.con = res.con;
  if (res.con) this.dp2.aptBonus(this.dp1);
  // finally, notify viewers
  this.notifyIfChanged(true);
}

// the shapes, mfe, pairing probabilities, for state1
DesignModel.prototype.setState1 = function (res) {
  this.ns1 = res.ns;
  if (apDebug>1) console.log('setState1: ns1='+this.ns1)
  this.me1 = res.mfe;
  if (apDebug>1) console.log('setState1: me1='+this.me1)
  this.dp1 = new DotPlotShape(this.apc,res.seq,null,res.plis);
  // finally, notify viewers
  this.getState2();
}

// recompute the shapes, mfe, pairing probabilities, etc.
DesignModel.prototype.getState2 = function () {
  // finally, notify viewers
  if (!apStub) {
    this.dp2 = new DotPlotShape(this.apc,this.seq,this.con,null);
    if (this.con) this.dp2.aptBonus(this.dp1);
    this.ns2 = this.apc.fold(this.seq,this.con);
    if (apDebug>0) console.log('ns2: '+this.ns2)
    this.me2 = this.apc.energy_of_structure(this.seq,this.ns2);
    this.notifyIfChanged(true);
  } else {
    this.apc.pullstate(this.seq,this.apt,this.setState2.bind(this));
  }
}

// recompute the shapes, mfe, pairing probabilities, etc.
DesignModel.prototype.getState1 = function () {
  // finally, notify viewers
  if (!apStub) {
    this.dp1 = new DotPlotShape(this.apc,this.seq,null,null);
    this.ns1 = this.apc.fold(this.seq);
    if (apDebug>0) console.log('ns1: '+this.ns1)
    this.me1 = this.apc.energy_of_structure(this.seq,this.ns1);
    this.getState2();
  } else {
    this.apc.pullstate(this.seq,null,this.setState1.bind(this));
  }
}

// look for multiple instances of common aptamers and make constraint strings
DesignModel.prototype.findSites = function (seq,sites) {
  console.log('findSites('+seq+')');
  for (var n=0; n<sites.length; n++) {
    var site = sites[n];
    if (seq.match(site.S1) && site.S2==undefined) {
      console.log('found '+site.id+' site')
      this.siteid = site.id;
      var re1 = RegExp(site.S1,'g');
      var m1 = [];
      var m = re1.exec(seq);
      while (m) { m1.push(m); m = re1.exec(seq); }
      var carr = [];
      for (var i=0; i<m1.length; i++) {
        carr.push([this.calcAptamer(seq,m1[i],null,site.C1,null)]);
      }
      return carr;
    } else if (site.S2 && seq.match(site.S1) && seq.match(site.S2)) {
      console.log('found '+site.id+' site')
      this.siteid = site.id;
      var re1 = RegExp(site.S1,'g');
      var m1 = [];
      var m = re1.exec(seq);
      while (m) { m1.push(m); m = re1.exec(seq); }
      var re2 = RegExp(site.S2,'g');
      var m2 = [];
      var m = re2.exec(seq);
      while (m) { m2.push(m); m = re2.exec(seq); }
      var carr = [];
      for (var i=0; i<m1.length; i++) {
        for (var j=0; j<m2.length; j++) {
          carr.push([this.calcAptamer(seq,m1[i],m2[j],site.C1,site.C2)]);
        }
      }
      return carr;
    }
  }
  return [];
}

// pick the constraint that leads to the minimum energy folding
DesignModel.prototype.minEnergy = function (sites) {
  if (!apStub) return null;
  var minsite = null;
  var minfe = 0.0;
  for (var i=0; i<sites.length; i++) {
    var s = sites[i];
    var con = this.toViennaCons(s);
    var shp = this.apc.fold(this.seq,con);
    var mfe = this.apc.energy_of_structure(this.seq,shp);
    if (mfe<=minfe) {
      minsite = s;
      minfe = mfe;
    }
  }
  return minsite;
}

// (re)compute the apt, con and rep sites/strings
DesignModel.prototype.resite = function () {
  this.apts = this.findSites(this.seq,apAptamers);
  if (apDebug>0) console.log('apts='+this.apts);
  if (!apStub && this.apts.length>1) {
    this.apt = this.minEnergy(this.apts);
  } else this.apt = this.findSite(this.seq,apAptamers);
  this.aptid = (this.apt ? this.siteid : '');
  if (apDebug>1) console.log('apt: '+this.apt)
  this.setval('apt',this.apt);
  this.con = this.toViennaCons(this.apt);
  if (apDebug>1) console.log('con: '+this.con)
  this.setval('con',this.con);
  this.reps = this.findSites(this.seq,apReporters);
  if (apDebug>0) console.log('reps='+this.reps);
  if (!apStub && this.reps.length>1) {
    this.rep = this.minEnergy(this.reps);
  } else this.rep = this.findSite(this.seq,apReporters);
  this.repid = (this.rep ? this.siteid : '');
  if (apDebug>1) console.log('rep: '+this.rep)
  this.setval('rep',this.rep);
}

// recompute the shapes, mfe, pairing probabilities, etc.
DesignModel.prototype.recompute = function () {
  this.resite();
  this.getState1();
}

// set the sequence and recompute NS, MFE, DP, etc.
DesignModel.prototype.setseq = function (seq) {
  if (seq) {
    this.seq = seq;
    if (!this.apc.frozen) {
      if (this.apc.autosync) {
        if (seq!=this.apc.seq) this.apc.set_sequence_string(seq);
      }
      this.recompute();
      this.notifyIfChanged(true);
    }
  }
}

// holds the metadata associated with viewing a design
function DesignView(apc,model) {
  this.apc = apc;
  this.model = model;
  this.style = apc.style;
  this.valid = true;
  // for the moment, default to natural mode
  this.style = 'arc';
  this.view = 'states';
  this.automark = true;
  var myView = this;
  this.changed = function (model) {
    myView.valid = false;
    if (myView.model!=model) {
      if (myView.model) myView.model.noInterest(myView);
    }
    myView.model = model;
    if (model) {
      model.addInterest(myView,myView.changed.bind(myView));
      myView.valid = false;
      myView.recompute();
      myView.draw(apc.vp.ctx);
      apc.vp.valid = false;
    }
  }
  if (model) model.addInterest(this,this.changed.bind(this));
  return this;
}

// Determine if a point is inside the DesignView's bounds
DesignView.prototype.contains = function(mx, my) {
  // All we have to do is make sure the Mouse X,Y fall inside
  return (this.x <= mx) && (this.y <= my) &&
         ((this.x + this.w)> mx) && ((this.y + this.h)>my);
}

// Determine if a pair is the apt or rep
DesignView.prototype.inXY = function(sx,sy) {
  if (apDebug>0) console.log('inXY sx='+sx+' sy='+sy)
  var apt = this.apt;
  if (apt && apt.match[sx-1]==sy) return this.model.aptid;
  var rep = this.rep;
  if (rep && rep.match[sx-1]==sy) return this.model.repid;
  return '';
}

DesignView.prototype.rescale = function (w,h) {
  w = w||this.w;
  h = w||this.h;
  console.log("DesignView.rescale: w="+w+" h="+h);
  this.cols = (this.model? this.model.seq.length+1 : 1);
  this.scale = (Math.min(w,h)-2)/this.cols;
  this.lw = Math.floor(this.scale/2.0)+1;
  if (this.scale>5) this.boxsiz = this.scale-1;
  else this.boxsiz = this.scale;
  this.visible= (w<=0 || h<=0);
  this.radius = w*1.3/(this.cols);
}

DesignView.prototype.fitWithin = function (x,y,w,h) {
  console.log("DesignView.fitWithin: x="+x+" y="+y+" w="+w+" h="+h);
  x = x || 0;
  y = y || 0;
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.rescale();
}

DesignView.prototype.calcXY = function (mx, my) {
  var selX = 0;
  var selY = 0;
  if (this.style=='arc' || this.style=='arch') {
    var sel = 0;
    var w = this.w;
    var dt = this.w/this.cols;
    var x0 = (w - this.cols*dt)/2;
    var y0 = this.h/2;
    var rawX = (mx-x0)/dt
    var rawY = (my-y0)/dt;
    if (Math.abs(rawY)>1.0) {
      selX = Math.round(rawX-rawY);
      selY = Math.round(rawX+rawY);
    } else {
      //console.log('rawX='+rawX+' rawY='+rawY);
      selX = Math.round(rawX);
      selY = Math.round(rawX);
    }
  } else if (this.style=='ring') {
  } else {
    selX = Math.floor((mx-this.x)/this.scale);
    selY = Math.floor((my-this.y)/this.scale);
  }
  if (apDebug>1) console.log('calcXY x='+selX+' y='+selY);
  var xy = {'x': selX, 'y': selY};
  return xy;
}

DesignView.prototype.pairname = function(x,y) {
  var apc = this.apc;
  var basepair = "";
  var seq = this.seq || '';
  x = x || apc.selXY.x;
  y = y || apc.selXY.y;
  if (x>0 && x<=seq.length) {
    var basepair = seq[x-1]+x.toString();
    if (y>0 && y<=seq.length && y!=x) {
      basepair = basepair+':'+seq[y-1]+y.toString();
    }
  }
  if (apDebug>1) console.log('pairname='+basepair)
  return basepair;
}

DesignView.prototype.pairdoc2 = function(x,y,name,dp) {
  var apc = this.apc;
  var docstr = "";
  var seq = this.seq || '';
  var pc = 0.0;
  x = x || apc.selXY.x;
  y = y || apc.selXY.y;
  if (dp) {
    if (x>0 && x<=seq.length) {
      var nstr = ' '+name+': '
      var fe = 0;
      if (y>0 && y<=seq.length && y!=x) {
        pc = dp.pprows[x][y]*100.0;
      } else {
        pc = dp.pprows[0][x]*100.0;
      }
      fe = apProbToFE(pc/100.0);
      if (apDebug>1) console.log('x='+x+' y='+y+' pc='+pc+' fe='+fe);
      if (fe<9.99) {
        docstr = [nstr,rnd2html(fe,7)," kcal",rnd2html(pc,8),"%"].join('');
      } else {
        pc = 0.0;
      }
    }
  }
  if (apDebug>1) console.log('docstr='+docstr)
  return [docstr,pc];
}

DesignView.prototype.pairdoc = function(x,y,name,dp) {
  return this.pairdoc2(x,y,name,dp)[0];
}

DesignView.prototype.pairnote = function(x,y,n) {
  var note = "";
  n = n || '';
  var basepair = apPadH(this.pairname(x,y), 8);
  var model = this.model || {};
  if (model.dp1) {
    var pd1 = this.pairdoc2(x,y,"S1",model.dp1);
    if (model.dp2 && model.dp1!=this.dp2) {
      var pd2 = this.pairdoc2(x,y,"S2",model.dp2);
      var p1 = pd1[1];
      var p2 = pd2[1];
      if (pd1[0].length>0 && pd2[0].length>0) note = '| '+pd1[0]+' | '+pd2[0];
      else if (pd1[0].length>0 || pd2[0].length>0) note = '| '+pd1[0]+pd2[0];
      if (note.length==0) note='';
      else if (p2==p1 || (p2<p1*1.05 && p1<p2*1.05)) {
        note += " | static";
      } else if (pd2[1]>pd1[1]) {
	// ON
        note+=" | ON&nbsp "+(pd1[1]>0.0?rnd2html(pd2[1]/pd1[1]):'inf')+'x';
      } else {
        // OFF
        note+=" | OFF "+(pd2[1]>0.0?rnd2html(pd1[1]/pd2[1]):'inf')+'x';
      }
    } else {
      note = pd1[0];
    }
    if (n.length>0) note += ' ' + n;
  }
  return basepair+' '+note+'<br/>';
}

DesignView.prototype.renote2 = function(x,y) {
  this.note2 = this.pairnote(x,y);
  //console.log("note2:\n"+note2);
  apById('note2').innerHTML = this.note2;
}

DesignView.prototype.renote1 = function(x,y) {
  var marks = this.marks||{};
  var keys = Object.keys(marks).sort();
  var notes = [];
  for (var i=0; i<keys.length; i++) {
    var mark = marks[keys[i]];
    notes.push(this.pairnote(mark.x,mark.y,mark.note));
  }
  this.note1 = notes.join('');
  //console.log("note1:\n"+note1);
  apById('note1').innerHTML = this.note1;
}


DesignView.prototype.doUnmark = function () {
  this.marks = {};
  this.automark = false;
  this.draw();
  this.renote1();
}

DesignView.prototype.hasMarkXY = function (selX, selY) {
  var n3 = function(n) { return (n/1000).toFixed(3).slice(2); };
  if (apDebug>1) console.log("DesignView.hasMarkXY: selX="+selX+" sely="+selY)
  if (selX==selY) selY = 0;
  if (selX>0 && selX<=this.seq.length && selY>=0 || selY<=this.seq.length) {
    var marks = this.marks || {};
    var tag = (selY==0?n3(selX):n3(selX)+":"+n3(selY));
    if (marks[tag]) return true;
  }
  return false;
}

DesignView.prototype.doMarkXY = function (selX, selY, note) {
  note = note || this.inXY(selX,selY);
  var n3 = function(n) { return (n/1000).toFixed(3).slice(2); };
  //console.log("DesignView.doMarkXY: selX="+selX+" sely="+selY);
  if (selX==selY) selY = 0;
  if (selX>0 && selX<=this.seq.length && selY>=0 || selY<=this.seq.length) {
    var marks = this.marks || {};
    var tag = (selY==0?n3(selX):n3(selX)+":"+n3(selY));
    if (apDebug>1) console.log('note='+note);
    if (marks[tag]) delete marks[tag];
    else marks[tag] = {'x': selX, 'y': selY, 'note': note};
    this.marks = marks;
    this.valid = false;
    this.renote1();
  }
}

// see if a reporter seems to turn on or off
DesignModel.prototype.doRepOnOff = function () {
  var rep = this.rep;
  if (!rep || !this.dp1 || !this.dp2) return true;
  var re2 = /(\-*)([^-]+)(\-+)([^-]+)(\-*)/;
  var re1 = /(\-*)([^-]+)(\-*)/;
  var m2 = rep.match(re2);
  var m1 = rep.match(re1);
  if (m2) {
    var x1 = m2[1].length+1;
    var x2 = m2[1].length+m2[2].length;
    var y1 = m2[1].length+m2[2].length+m2[3].length+m2[4].length;
    var y2 = m2[1].length+m2[2].length+m2[3].length+1;
    var s1 = this.dp1.pprows[x1][y1]*this.dp1.pprows[x2][y2];
    var s2 = this.dp2.pprows[x1][y1]*this.dp2.pprows[x2][y2];
    return s2>s1;
  } else if (m1) {
    var x1 = m1[1].length+1;
    var y1 = m1[1].length+m1[2].length;
    return this.dp2.pprows[x1][y1] > this.dp1.pprows[x1][y1];
  }
  return false;
}

// mark the limits of the strongest aptamer and reporter sites
DesignView.prototype.doMarkCons = function (con,on,note) {
  on = on || false;
  var re2 = /(\-*)([^-]+)(\-+)([^-]+)(\-*)/;
  var re1 = /(\-*)([^-]+)(\-*)/;
  var m2 = con.match(re2);
  var m1 = con.match(re1);
  if (m2) {
    var x1 = m2[1].length+1;
    var x2 = m2[1].length+m2[2].length;
    var y1 = m2[1].length+m2[2].length+m2[3].length+m2[4].length;
    var y2 = m2[1].length+m2[2].length+m2[3].length+1;
    if (!on) { var t=x1; x1=y1; y1=t; t=x2; x2=y2; y2=t; }
    this.doMarkXY( x1, y1, note );
    this.doMarkXY( x2, y2, note );
  } else if (m1) {
    var x1 = m1[1].length+1;
    var y1 = m1[1].length+m1[2].length;
    if (!on) { var t=x1; x1=y1; y1=t; }
    this.doMarkXY( x1, y1, note );
  }
}

DesignView.prototype.doAutoMark = function () {
  this.marks = {};
  var model = this.model;
  if (model) {
    var apt = model.apt;
    if (apt) this.doMarkCons(apt,true,model.aptid);
    if (apDebug>0) console.log('reporter '+(this.on ? 'ON' : 'OFF'));
    var rep = model.rep;
    if (rep) this.doMarkCons(rep,this.on,model.repid);
    this.draw();
  }
  this.renote1();
}

// change a named element of undoable/redoable state logging the change
APState.prototype.update = function (name,after) {
  var a = this.delta.a || {};
  var b = this.delta.b || {};
  console.log("update("+name+")="+after);
  if ( !(name in b) ) {
     if (name=='seq') b[name] = this.dm.seq || '';
     else b[name] = this.getval(name) || '';
  }
  a[name] = after;
  this.setval(name,after);
  this.delta = {"a": a, "b": b};
}

// reset the undo/redo log states abandoning any uncomitted changes
APState.prototype.reset = function() {
  this.undo = [];
  this.redo = [];
  this.delta = {}
}

// commit all loggable changes since the last commit to the undo log
APState.prototype.commit = function() {
  if ('a' in this.delta) {
    for (var ab in this.delta) {
      for (var k in this.delta[ab]) {
        console.log("commit: "+ab+"["+k+"]="+this.delta[ab][k]);
      }
    }
    this.undo.push(this.delta);
    this.redo = [];
    this.delta = {};
    this.setState();
  }
}

// rollback the set of changes since the last commit
APState.prototype.abort = function () {
  var b = this.delta.b || {};
  for (var name in b) {
    console.log("abort: b["+k+"]="+b[k]);
    this.setval(name,b[name]);
  }
  this.delta = {};
  this.dm.setseq(this.getval('seq'));
  this.setState();
}

// replay a set of recorded changes found in the redo log
APState.prototype.doRedo = function () {
  this.abort();
  if (this.redo.length>0) {
    var delta = this.redo.pop() || {};
    if ('a' in delta) {
      for (var name in delta.a) {
         this.setval(name, delta.a[name]);
      }
    }
    this.undo.push(delta);
  }
  this.dm.setseq(this.getval('seq'));
  this.setState();
}

// rollback the last set of changes recorded in the undo log
APState.prototype.doUndo = function () {
  this.abort();
  if (this.undo.length>0) {
    var delta = this.undo.pop() || {};
    for (var ab in delta) {
      for (var k in delta[ab]) {
        console.log("undo: "+ab+"["+k+"]="+delta[ab][k]);
      }
    }
    if ('b' in delta) {
      for (var name in delta.b) {
         this.setval(name, delta.b[name]);
      }
    }
    this.redo.push(delta);
  }
  this.dm.setseq(this.getval('seq'));
  this.setState();
}

APState.prototype.fixseq = function (seq) {
  var fix = this.getval('fix');
  if (!fix || !seq || fix.length!=seq.length) return seq;
  var aseq = seq.split('');
  for (var i=0; i<aseq.length; i++) {
    if (fix[i]!='-') aseq[i] = fix[i];
  }
  return aseq.join('');
}

DesignView.prototype.doSeqSubst = function (c,n) {
  console.log("DesignView.doSubst: c="+c+" n="+n);
  var s = this.seq || '';
  console.log("DesignView.doSubst: s="+s);
  if (n>0 && s.length>=(n+c.length-1)) {
    var s2 = s.slice(0,n-1) + c + s.slice(n+c.length-1)
    s2 = this.apc.fixseq(s2);
    this.seq = s2;
    console.log('DesignView.doSeqSubst: '+this.seq);
    if (s2!=s) {
      this.apc.update('seq',s2);
    }
    return s!=s2;
  } else {
    console.log('DesignView.doSeqSubst: misaligned')
  }
  return false;
}

DesignView.prototype.doOpXY = function (op, selX, selY, action) {
  action = action || 'click';
  console.log("DesignView.doOpXY: selX="+selX+" sely="+selY)
  if (selX>0 && selX<=this.seq.length && selY>=0 || selY<=this.seq.length) {
    if (['a','c','g','u'].includes(op)) {
      var stamp = op.toUpperCase();
      if ( action.match( /(shift-)/ ) ) stamp = invert(stamp);
      var changed = this.doSeqSubst(stamp,selX,'seq');
      if (selX!=selY && selY>0 && selY<=this.model.seq.length) {
        changed = this.doSeqSubst(invert(stamp),selY,'seq') || changed;
      }
      if (changed) {
        this.model.setseq(this.seq);
        if (apDebug>0) console.log('new: '+this.model.seq);
        this.apc.commit();
        this.recompute();
      }
      this.draw();
    }
    this.renote2();
  }
  this.valid = false;
}

DesignView.prototype.doOp = function (op, mx, my, action) {
  action = action || 'click';
  var selXY = this.calcXY(mx,my);
  this.apc.selXY = selXY;
  var selX = selXY.x;
  var selY = selXY.y;
  console.log("DesignView.doOp: mx="+mx+" my="+my)
  if (selX>0 && selX<=this.seq.length && selY>=0 || selY<=this.seq.length) {
    if (action=='ctrl-click') {
      this.doMarkXY(selX,selY,null);
      this.draw();
    } else if (action=='click' || action=='shift-click') {
      this.doOpXY(op,selX,selY,action);
      this.draw();
    }
  }
  this.valid = false;
}

DesignView.prototype.recompute = function () {
  var model = this.model;
  if (model) {
    if (model.seq!=this.seq || true) {
      // model.valid is false if the model has changed
      this.seq = model.seq;
      this.rescale();
      this.me1 = model.me1;
      this.me2 = model.me2;
      this.apt = new ConstrainShape(this.apc,model.apt);
      this.rep = new ConstrainShape(this.apc,model.rep);
      this.ns1 = new ConstrainShape(this.apc,model.ns1);
      this.ns2 = new ConstrainShape(this.apc,model.ns2);
      this.on = model.doRepOnOff();
      if (apDebug>0) console.log('reporter '+(this.on ? 'ON' : 'OFF'));
      model.valid = true;
    }
    if (this.automark) this.doAutoMark();
    else this.renote1();
  }
}

DesignView.prototype.drawBondArc = function(ctx,nx,ny,dir,color,colory,lw) {
  if (nx==0 || ny==0) return;
  var w = this.w;
  var dt = this.w/this.cols;
  var xc = (nx + (ny-nx)/2.0)*dt;
  var yc = this.y + this.w/2;
  dir = dir || 1
  //console.log("color="+color);
  var r = Math.abs(nx-ny)*dt/2.0;
  if (nx!=ny) {
    ctx.beginPath();
    ctx.strokeStyle=color;
    ctx.lineWidth = lw||this.lw;
    if (dir>0) ctx.arc(xc,yc,r,Math.PI,2.0*Math.PI);
    else ctx.arc(xc,yc,r,0.0,Math.PI);
    ctx.stroke();
  }
}

DesignView.prototype.drawBondGrid = function (ctx,nx,ny,up,color,colory) {
  var x = this.x;
  var y = this.y;
  var scale = this.scale;
  var boxsiz = this.boxsiz;
  if ((up>0 && nx<ny) || (up<0 && nx>ny)) {
    var t = nx; nx = ny; ny=t;
  }
  ctx.fillStyle = color;
  if (nx>0 && ny>0) {
    if (up>0) { // nx>ny
      ctx.fillRect(x+(ny+2)*scale+3,y+ny*scale+2,(nx-ny-1)*scale-4,boxsiz-3);
      ctx.fillRect(x+nx*scale+3,y+ny*scale+3,boxsiz-3,(nx-ny-1)*scale-2);
    } else { // ny>nx
      ctx.fillRect(x+nx*scale+2,y+(nx+2)*scale+2,boxsiz-3,(ny-nx-1)*scale-4);
      ctx.fillRect(x+nx*scale+2,y+ny*scale+3,(ny-nx-1)*scale-2,boxsiz-3);
    }
  }
}

DesignView.prototype.drawBondDot = function (ctx,nx,ny,up,color,colory) {
  var x = this.x;
  var y = this.y;
  var scale = this.scale;
  var boxsiz = this.boxsiz;
  if ((up>0 && nx<ny) || (up<0 && nx>ny)) {
    var t = nx; nx = ny; ny=t;
  }
  ctx.fillStyle = color;
  ctx.fillRect(x+nx*scale+1,y+ny*scale+1,boxsiz,boxsiz);
}

DesignView.prototype.drawNodeDot = function(ctx,num,c) {
  var x = this.x;
  var y = this.y;
  var model = this.model || {};
  var scale = this.scale;
  var boxsiz = this.boxsiz;
  ctx.fillStyle = colorForC(c);
  ctx.fillRect(x+num*scale+1,y+num*scale+1,boxsiz,boxsiz);
  if (model.sel && model.sel.length>0 && model.sel[num-1]!='-') {
    //console.log('sel='+model.sel);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(x+num*scale+1,y+num*scale+1,boxsiz,boxsiz);
  }
  if (this.fix && this.fix[num-1]!='-') {
    ctx.strokeStyle = "#00C0C0";
    ctx.lineWidth = 1;
    ctx.strokeRect(x+num*scale+1,y+num*scale+1,boxsiz,boxsiz);
  }
}

DesignView.prototype.drawNodeArc = function(ctx,num,c) {
  var w = this.w;
  var dt = this.w/this.cols;
  var x = this.x + this.w/2 + (num-this.cols/2)*dt;
  var y = this.y + this.h/2;
  var model = this.model || {};
  ctx.beginPath();
  ctx.arc(x,y,this.radius/2-1,0,2.0*Math.PI);
  ctx.fillStyle = colorForC(c);
  ctx.fill();
  ctx.strokeStyle='#000';
  ctx.lineWidth = ((this.fix && this.fix[num-1]!='-') ? 2 : 1);
  ctx.stroke();
  if (this.hasMarkXY(num,num)) {
    this.drawMarkArc(ctx,num,num,'#00FFFF');
  }
}

DesignView.prototype.drawNode = function(ctx,num,c) {
  ctx.fillStyle = colorForC(c);
  if (this.style=='arc') return this.drawNodeArc(ctx,num,c);
  else return this.drawNodeDot(ctx,num,c);
}

DesignView.prototype.drawMarkArc = function(ctx,sx,sy,c) {
  c = c || "#00FFFF";
  if (!sy || sy==0) sy=sx;
  var w = this.w;
  var dt = this.w/this.cols;
  if (sy==0) sy=sx;
  var x = this.x + this.w/2 + ((sy+sx)/2.0-this.cols/2)*dt;
  var dy = (sy-sx)/2.0
  var y = this.y + this.h/2 + dy*dt;
  var model = this.model || {};
  ctx.strokeStyle = c;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x,y,this.radius/2,0,2.0*Math.PI);
  ctx.stroke();
  var up = (sx>sy?1:-1);
  if (apDebug>1) console.log('up='+up);
  this.drawBondArc(ctx,sx,sy,up,c,c,2);
}

DesignView.prototype.drawMarkDot = function(ctx,sx,sy,c) {
  c = c || "#00FFFF";
  if (!sy || sy==0) sy=sx;
  var x = this.x;
  var y = this.y;
  var model = this.model || {};
  var scale = this.scale;
  var boxsiz = this.boxsiz;
  ctx.strokeStyle = c;
  ctx.lineWidth = 1;
  ctx.strokeRect(x+sx*scale+1,y+sy*scale+1,boxsiz,boxsiz);
}

DesignView.prototype.drawMark = function(ctx,sx,sy,c) {
  if (this.style=='arc') return this.drawMarkArc(ctx,sx,sy,c);
  else return this.drawMarkDot(ctx,sx,sy,c);
}

DesignView.prototype.drawMarks = function (ctx,c) {
  console.log("DesignView.drawMarks");
  var marks = this.marks || {};
  var keys = Object.keys(marks);
  for (var i=0; i<keys.length; i++) {
    var key = keys[i];
    var mark = marks[key];
    this.drawMark(ctx,mark.x,mark.y,c);
  }
}

DesignView.prototype.drawBond = function (ctx, x, y, up, color, colory) {
  color = color || "#000";
  colory = colory || color;
  if (this.style=='arc') return this.drawBondArc(ctx,x,y,up,color,colory);
  else if (this.style=='grid')
    return this.drawBondGrid(ctx,x,y,up,color,colory);
  else return this.drawBondDot(ctx,x,y,up,color,colory);
}

DesignView.prototype.highlightArc = function(ctx,num,up,color) {
  color = color || "#000";
  up = up || 1;
  var w = this.w;
  var dt = this.w/this.cols;
  var x = this.x + this.w/2 + (num-this.cols/2)*dt;
  var y = this.y + this.h/2;
  var x0 = x-dt/2.0;
  var y0 = y-up*dt/1.5;
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.moveTo(x0,y0);
  ctx.lineTo(x0+dt,y0);
  ctx.stroke();
}

DesignView.prototype.highlightGrid = function(ctx,num,up,color) {
  color = color || "#000";
  up = up || 1;
  var x = this.x;
  var y = this.y;
  var scale = this.scale;
  var boxsiz = this.boxsiz;
  var x0 = x+(num+up/2.0)*scale+1;
  var y0 = y+(num-up/2.0)*scale+1;
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.moveTo(x0,y0);
  ctx.lineTo(x0+scale,y0+scale);
  ctx.stroke();
}

DesignView.prototype.highlight = function(ctx,num,up,color) {
  if (this.style=="arc") this.highlightArc(ctx,num,up,color);
  else this.highlightGrid(ctx,num,up,color);
}

DesignView.prototype.highlightMatch = function(ctx,m1,up,color) {
  if (apDebug>1) console.log('in highlightMatch '+color+" length="+m1.length);
  if (apDebug>1) console.log("m1: "+m1);
  for (var x=0; x<m1.length; x++) {
    if (m1[x]>=0 || m1[x]=='.' || m1[x]=='(' || m1[x]==')') {
      this.highlight(ctx,x+1,up,color);
    }
  }
}

DesignView.prototype.drawMatch = function(ctx,m1,up,c) {
  up = up || 1;
  c = c || "#000";
  for (var x=0; x<m1.length; x++) {
    if ((x+1)<m1[x]) {
      this.drawBond(ctx,x+1,m1[x],up,c);
    }
  }
}

DesignView.prototype.drawMatches = function(ctx,m1,m2,up) {
  up = up || 1;
  if (m2 && m2.length!=m1.length) {
    console.log("drawMatches: length mismatch: "+m1.length+"!="+m2.length);
    ms = m1;
  }
  m2 = m2 || m1;
  var left = (this.apc.redcyan ? '#ff0000' : '#ffff00');
  var right = (this.apc.redcyan ? '#00ffff' : '#0000ff');
  for (var x=0; x<m1.length; x++) {
    if ((x+1)<m1[x]) {
      if (m1[x]==m2[x] || m2[x]==-1) this.drawBond(ctx,x+1,m1[x],up,"#000");
      else this.drawBond(ctx,x+1,m1[x],up,right);
    }
    if ((x+1)<m2[x]) {
      if (m1[x]==-1) this.drawBond(ctx,x+1,m2[x],up,"#000");
      else if (m1[x]!=m2[x]) this.drawBond(ctx,x+1,m2[x],up,left);
    }
  }
}

// It only ever does something if the canvas gets invalidated by our code
DesignView.prototype.drawNatural = function(ctx) {
  var compare = this.apc.mem && this.apc.compare;
  // if our state is invalid, redraw and validate!
  //console.log('enter DesignView.drawNatural')
  //this.apc.addNote2('entering DesignView.prototype.draw');
  var seq = this.seq;
  this.model.sel = this.apc.getval('sel');
  // ** Add stuff you want drawn in the background all the time here **
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(this.x,this.y,this.w,this.h);
  if (!seq || seq.length==0) return;
  if (!this.ns1 || !this.ns1.match) return;
  if (!this.apc.mem || !this.apc.mem.dp1 || !compare) {
    // single design
    // upper
    var m1 = this.ns1.match;
    var m2 = (this.ts1 ? this.ts1.match : m1);
    if(m1&&m2) this.drawMatches(ctx,m1,m2,1);
    // lower
    m1 = this.ns2.match;
    m2 = (this.ts2 ? this.ts2.match : m1);
    if(m1&&m2) this.drawMatches(ctx,m1,m2,-1);
  } else {
    // merged plots
    // upper
    var m1 = this.ns1.match;
    var m2 = this.apc.mem.ns1.match;
    if(m1&&m2) this.drawMatches(ctx,m1,m2,1);
    // lower
    m1 = this.ns2.match;
    m2 = this.apc.mem.ns2.match;
    if(m1&&m2) this.drawMatches(ctx,m1,m2,-1);
  }
  this.drawMarks(ctx,"#00FFFF");
  this.drawNodes(ctx);
  if (this.model.apt) this.highlightMatch(ctx,this.model.apt,-1.5,"#ff0000");
  var dir = (this.on ? -1.5 : 1.5);
  if (this.model.rep) this.highlightMatch(ctx,this.model.rep,dir,"#003399");
  //console.log('leave DesignView.drawNatural')
}

DotPlotShape.prototype.merge = function (dp2) {
  var nbins2 = this.apc.nbins2;
  var maxbin = nbins2-1;
  var bonds = [];
  for (var r=0; r<this.pprows.length-1; r++) {
    var row1 = this.pprows[r];
    var row2 = dp2.pprows[r];
    for (var c=r+1; c<row1.length-1 && c<row2.length-1; c++) {
      var fe1 = apProbToFE(row1[c]);
      var fe2 = apProbToFE(row2[c]);
      var b1 = Math.min(Math.floor(fe1/binsize),maxbin);
      var b2 = Math.min(Math.floor(fe2/binsize),maxbin);
      if (b1<maxbin || b2<maxbin) {
        //console.log('b1='+b1+' b2='+b2+' w='+bins2weight(b1,b2,nbins2));
        bonds.push([r,c,bins2weight(b1,b2,nbins2)]);
      }
    }
  }
  bonds.sort(function(a, b){return a[2] - b[2]});
  console.log('merge: bonds.length='+bonds.length);
  return bonds;
}

function MergePlot(apc,dp1,dp2) {
  this.dp1 = dp1;
  this.dp2 = dp2;
  apc.make_cmap();
  this.nbins2 = apc.nbins2;
  this.binsize = apc.binsize;
  this.merged = dp1.merge(dp2);
  return this;
}

// It only ever does something if the canvas gets invalidated by our code
DesignView.prototype.drawDotPlot = function(ctx,compare,withmfe) {
  compare = compare || this.apc.compare;
  // if our state is invalid, redraw and validate!
  //console.log('enter DesignView.drawDotPlot')
  var seq = this.seq;
  this.model.sel = this.apc.getval('sel');
  // ** Add stuff you want drawn in the background all the time here **
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(this.x,this.y,this.w,this.h);
  if (apDebug>1) console.log('drawDotPlot');
  if (!this.seq || this.seq.length==0) return;
  if (!this.apc.mem || !this.apc.mem.dp1 || !compare || withmfe) {
    // single dotplot
    if (apDebug>1) console.log('drawDotPlot: single');
    // upper
    var plis = (this.model.dp1 ? this.model.dp1.plis : []);
    if (apDebug>1) console.log('upper length='+plis.length);
    for (var i=0; i<plis.length; i++) {
      var b = plis[i];
      var c = this.apc.colorof(b[2]);
      if (c) this.drawBond(ctx,b[0],b[1],1,c);
    }
    // lower
    plis = (this.model.dp2!=this.model.dp1 && this.model.dp2 ? this.model.dp2.plis : []);
    if (apDebug>1) console.log('lower length='+plis.length);
    for (var i=0; i<plis.length; i++) {
      var b = plis[i];
      var c = this.apc.colorof(b[2]);
      if (c) this.drawBond(ctx,b[0],b[1],-1,c);
    }
    // optional natural shapes
    if (withmfe) {
      var mfe = this.apc.getval('mfe') || 'rgba(51,255,51,0.3)';
      this.apc.setval('mfe', mfe);
      var m1 = this.ns1.match;
      if (m1) this.drawMatch(ctx,m1,1,mfe);
      var m2 = this.ns2.match;
      if (m2) this.drawMatch(ctx,m2,-1,mfe);
    }
  } else {
    // merged plots
    // upper
    if (apDebug>1) console.log('drawDotPlot: MergePlot');
    var mplot = MergePlot(this.apc,this.dp1,this.apc.mem.dp1);
    var merged = mplot.merged || [];;
    for (var i=0; i<merged.length; i++) {
      var b = merged[i];
      var c = this.apc.cmap2[b[2]];
      if (c) this.drawBond(ctx,b[0],b[1],1,c);
    }
    // lower
    mplot = MergePlot(this.apc,this.dp2,this.apc.mem.dp2);
    merged = mplot.merged || [];;
    for (var i=0; i<merged.length; i++) {
      var b = merged[i];
      var c = this.apc.cmap2[b[2]];
      if (c) this.drawBond(ctx,b[0],b[1],-1,c);
    }
  }
  this.drawMarks(ctx,"#00FFFF");
  this.drawNodes(ctx);
  if (this.model.apt) this.highlightMatch(ctx,this.model.apt,-1.5,"#ff0000");
  var dir = (this.on ? -1.5 : 1.5);
  if (this.model.rep) this.highlightMatch(ctx,this.model.rep,dir,"#003399");
  //console.log('leave DesignView.drawDotPlot')
}


DesignView.prototype.drawNodes = function (ctx) {
  if (apDebug>0) console.log('drawNodes');
  var seq = this.seq;
  // draw all Nodes
  for (var i = 0; i < seq.length; i++) {
    this.drawNode(ctx,i+1,seq[i])
  }
}

DesignView.prototype.draw = function (ctx) {
  ctx = ctx || this.apc.vp.ctx;
  console.log('DesignView.draw: seq=',this.seq)
  //this.drawNatural(ctx);
  if (this.view=='natural') this.drawNatural(ctx);
  else if (this.view=='states') this.drawDotPlot(ctx,null,true);
  else this.drawDotPlot(ctx,this.apc.compare,false);
  this.renote1();
  this.renote2();
}

ViewPort.prototype.getMouse = function(e) {
  var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
  // Compute the total offset
  if (element.offsetParent !== undefined) {
    do {
      offsetX += element.offsetLeft;
      offsetY += element.offsetTop;
    } while ((element = element.offsetParent));
  }
  // Add padding and border style widths to offset
  // Also add the <html> offsets in case there's a position:fixed bar
  offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
  offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;
  mx = e.pageX - offsetX;
  my = e.pageY - offsetY;
  // We return a simple javascript object (a hash) with x and y defined
  return {x: mx, y: my};
}

APState.prototype.doClick = function() {
  // Hold off the script timeout for an hour.
  apDefer();
  // Click button callback
  if (apDebug>0) console.log("doClick");
  this.getState();
  this.text = this.text + " click";
  this.setState();
  return null;
}

// replace sub at i in cons flipping brackets if desired
DesignModel.prototype.repl = function (cons,i,sub,flip) {
  flip = flip||false;
  if (flip) {
    if (sub.match(/\(/)) sub = sub.replace(/\(/g, ')')
    else sub = sub.replace(/\)/g, '(')
  }
  return cons.slice(0,i)+sub+cons.slice(i+sub.length)
}

// create a string of len '-' signs
APState.prototype.dontcare = function (len) {
  return Array(len+1).join('-');
}

// construct a pseudo-contraints string from 1 or two matches
DesignModel.prototype.calcAptamer = function (seq,m1,m2,c1,c2) {
  var cons = this.apc.dontcare(seq.length);
  if (m1 && m2==null) {
    return this.repl(cons,m1.index,c1,false);
  } else if (!m1 || !m2) return "";
  var flip = m1.index>m2.index;
  return this.repl(this.repl(cons,m1.index,c1,flip),m2.index,c2,flip);
}

// switch '().' for paired and unpaired and '-' for don't care
// to '()x' for paired and unpaired and '.' for don't care [for Vienna]
DesignModel.prototype.toViennaCons = function (site) {
  return site.replace(/\./g,'x').replace(/-/g,'.');
}

// look for common aptamers and construct a string using
// '().' for paired and unpaired and '-' for don't care
DesignModel.prototype.findSite = function(seq,apts) {
  // Hold off the script timeout for an hour.
  if (apDebug>1) console.log('findSite('+seq+')');
  for (var n=0; n<apts.length; n++) {
    var apt = apts[n];
    var m1 = (apt.S1 ? seq.match(apt.S1) : null);
    var m2 = (apt.S2 ? seq.match(apt.S2) : null);
    if (apt.S2==undefined && m1) {
      if (apDebug>1) console.log('found '+apt.id+' site')
      this.siteid = apt.id;
      return this.calcAptamer(seq,m1,null,apt.C1,null);
    } else if (m1 && m2) {
      if (apDebug>1) console.log('found '+apt.id+' site')
      this.siteid = apt.id;
      return this.calcAptamer(seq,m1,m2,apt.C1,apt.C2);
    }
  }
  return "";
}

// return a sparce probabilities matrix [x1, y1, p1, x2, y2, p2, ...]
APState.prototype.get_sequence_string = function () {
  if (apStub) return byId("seq").value;
  if (!this.applet) return;
  return this.applet.get_sequence_string();
}

// return a sparce probabilities matrix [x1, y1, p1, x2, y2, p2, ...]
APState.prototype.set_sequence_string = function (seq) {
  if (apStub) {
    byId("seq").value = (seq ? seq.toString() : '');
  } else if (this.applet) {
    this.applet.set_sequence_string(seq);
  }
  this.seq = seq;
}

// return an energy for a seq,shape
APState.prototype.energy_of_structure = function (seq,shape) {
  if (!this.applet || apStub) return 0.0;
  return this.applet.energy_of_structure(seq,shape);
}

// return a folded shape
APState.prototype.fold = function (seq,constr) {
  if (!this.applet || apStub) return null;
  if (constr && constr.length>0) return this.applet.fold(seq,constr);
  else return this.applet.fold(seq);
}

// return a sparce probabilities matrix [x1, y1, p1, x2, y2, p2, ...]
APState.prototype.pairing_probabilities = function (seq,constr) {
  if (!this.applet || apStub) return [];
  if (constr && constr.length>0)
    return this.applet.pairing_probabilities(seq,constr);
  return this.applet.pairing_probabilities(seq);
}

APState.prototype.getprob = function(seq,con,cb) {
  if (apDebug>0) console.log('getprob: seq='+seq);
  if (apDebug>0 && con) console.log('getprob: con='+con);
  var xhr = new XMLHttpRequest();
  var path = "/spp?seq="+seq+(con ? "&con="+con : "");
  xhr.open("GET", path, true);
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        console.log(xhr.responseText);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);
}

// parse the seq, con, mfs, mfe, and pairing probs from text
//   #seq con
//   #mfs mfe
//   x1 y1 p1
//   x2 y2 p2
//   ...
// then pass as an object to the callback
APState.prototype.parseState = function(txt,cb) {
  if (apDebug>1) console.log('parseState');
  var lines = txt.split(/[\r\n]+/g);
  var res = {};
  for (var i=0; i<lines.length; i++) {
    lines[i] = lines[i].split(/ +/);
    if (i>1) lines[i] = lines[i].map(Number);
  }
  if (lines.length>1) {
    res.seq = lines[0][0].slice(1);
    res.con = (lines[0].length>1 ? lines[0][1] : null);
    res.mfe = Number(lines[1][1]);
    res.ns = lines[1][0].slice(1);
    res.plis = lines.slice(2);
  } else {
    console.log("parseState: lines[0]="+lines[0]);
    res.plis = [];
    res.seq = "";
    res.con = null;
    res.ns = "";
    res.mfe = 0.0;
  }
  if (apDebug>2) console.log('parseState: seq='+res.seq);
  if (apDebug>2) console.log('parseState: ns= '+res.ns);
  if (apDebug>2) console.log('parseState: plis.length= '+res.plis.length);
  if (cb) cb(res);
}

// return the mfe, shape, and pairing probabilities to a callback
APState.prototype.pullstate = function(seq,con,cb) {
  if (apDebug>1) console.log('pullstate: seq='+seq);
  if (apDebug>1 && con) console.log('pullstate: con='+con);
  var xhr = new XMLHttpRequest();
  var path = "/dppc?seq="+seq+(con ? "&con="+con : "");
  xhr.open("GET", path, true);
  var myState = this;
  xhr.onload = function (e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        myState.parseState(xhr.responseText,cb);
      } else {
        console.error(xhr.statusText);
      }
    }
  };
  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };
  xhr.send(null);
}

APState.prototype.doStyle = function(style) {
  // Hold off the script timeout for an hour.
  style = style || 'next';
  this.getState();
  if (apDebug>0) console.log("doStyle("+style+")");
  if (style=='next') {
    if (this.dv.style=='arc') style='dot';
    else if (this.dv.style=='dot') style='grid';
    else style='arc';
  }
  this.style = style;
  this.setval('style',style);
  this.vp.valid = false;
  this.dv.valid = false;
  this.dv.style = style;
  this.setState();
  this.vp.draw();
  return null;
}

// Arc button callback
APState.prototype.doArc = function() {
  return this.doStyle('arc')
}

// Grid button callback
APState.prototype.doGrid = function() {
  return this.doStyle('grid')
}

// Dot button callback
APState.prototype.doDot = function () {
  return this.doStyle('dot')
}

APState.prototype.doView = function(view) {
  // Hold off the script timeout for an hour.
  view = view || 'next';
  this.getState();
  if (apDebug>0) console.log("doView("+view+")");
  if (view=='next') {
    if (this.dv.view=='natural') view='dotplot';
    else if (this.dv.view=='dotplot') view='states';
    else view='natural';
  }
  this.view = view;
  this.setval('view',view);
  this.vp.valid = false;
  this.dv.valid = false;
  this.dv.view = view;
  this.setState();
  this.vp.draw();
  return null;
}

// Arc button callback
APState.prototype.doStates = function() {
  return this.doView('states')
}

// Arc button callback
APState.prototype.doDotplots = function() {
  return this.doView('dotplots')
}

// Dot button callback
APState.prototype.doNatural = function () {
  return this.doView('natural')
}

// Pull button callback
APState.prototype.doPull = function(cb) {
  // Hold off the script timeout for an hour.
  apDefer();
  this.autosync = false;
  this.getState(true);
  if (apDebug>0) console.log("doPull");
  if (this.dm) {
    this.dm.setseq( this.seq );
  }
  else console.log('dm='+this.dm)
  this.setState();
  return null;
}

// Push button callback
APState.prototype.doPush = function(cb) {
  // Hold off the script timeout for an hour.
  apDefer();
  this.autosync = false;
  this.getState();
  if (apDebug>0) console.log("doPush");
  if (this.dm) {
    this.set_sequence_string(this.dm.seq);
  }
  else console.log('dm='+this.dm)
  this.setState(true);
  return null;
}

// Sync button callback
APState.prototype.doSync = function(cb) {
  // Hold off the script timeout for an hour.
  apDefer();
  this.autosync = true;
  this.getState();
  if (apDebug>0) console.log("doSync");
  if (this.dm) {
    this.dm.setseq( this.seq );
  }
  else console.log('dm='+this.dm)
  this.setState(true);
  return null;
}

// Unmark button callback
APState.prototype.doUnmark = function(cb) {
  // Hold off the script timeout for an hour.
  apDefer();
  this.getState();
  if (apDebug>0) console.log("doUnmark");
  if (this.dv) {
    this.dv.doUnmark();
  }
  else console.log('dm='+this.dm)
  this.setState();
  return null;
}

// AutoMark button callback
APState.prototype.doAutoMark = function(cb) {
  // Hold off the script timeout for an hour.
  apDefer();
  this.getState();
  if (apDebug>0) console.log("doAutoMark");
  if (this.dv) {
    this.dv.automark = true;
    this.dv.recompute();
  }
  else console.log('dm='+this.dm)
  this.setState();
  return null;
}

// Wait until the APState state machine is in state "done"
// before executing the specified function 
APState.prototype.whenReadyDo = function( func ) {
  console.log( "(whenReadyDo) this = " + this );
  if (apc.fsm == "done") {
    //func.prototype.call(this);
    func.call( apc );
  } else {
    setTimeout( apc.whenReadyDo, 100, func); 
  }
}

APState.prototype.doDone = function() {
  if (this.bulk) {
    this.index = 0;
    this.bulk = false;
  }
  this.setState();
  return apDone();
}

APState.prototype.activateCBs = function() {
  // next line is async applet magic - leave unchanged
  apDefer();
  if (apButtons.length==0) {
    console.log(apBoosterTitle+": button callbacks activated");
    this.fsm = 'done';
    this.canvas = apById('canvas');
    if (this.canvas) console.log('got canvas!')
    var vp = (this.canvas ? new ViewPort(this,this.canvas) : null);
    this.vp = vp;
    if (vp) {
      this.dm = new DesignModel(this,this.seq);
      this.dv = new DesignView(this,this.dm);
    }
    this.vp.layoutPanes();
    this.seq = this.get_sequence_string();
    this.dm.setseq( this.seq );
    return apDone();
  }
  var name = apButtons[0];
  if (apById(name)) {
    var name2 = apButtons[apButtons.length-1];
    if (apDebug>1) console.log("activateCBs: name2="+name2);
    apById(name2).addEventListener('click',apActivations[name2].bind(this) );
    if (apDebug>0) console.log( name2+" activated" );
    apButtons.pop();
    apPollNextState( this.activateCBs.bind(this), 100 );
  } else {
    if (apDebug>0) console.log("activateCBs: wait on "+name);
    apPollNextState( this.activateCBs.bind(this), 500 );
  }
}

var apActivations = {
  'Arc': APState.prototype.doArc,
  'Dot': APState.prototype.doDot,
  'Grid': APState.prototype.doGrid,
  'Natural': APState.prototype.doNatural,
  'States': APState.prototype.doStates,
  'Dotplots': APState.prototype.doDotplots,
  'Push': APState.prototype.doPush,
  'Pull': APState.prototype.doPull,
  'Sync': APState.prototype.doSync,
  'Unmark': APState.prototype.doUnmark,
  'AutoMark': APState.prototype.doAutoMark,
};
var apButtons = Object.keys(apActivations);

function apBodyAppend(innerHTML) {
  if (!apStub) $("body").append(innerHTML);
  else byId("body").innerHTML = byId("body").innerHTML + innerHTML;
}

function apInputButton(id,value) {
  var apid = apId(id);
  value=value||id;
  return [ '<input type="button" id="',apid,'" value="',value,'/>' ].join('');
}

function apButton(id,value) {
  var apid = apId(id);
  value=value||id;
  return [ '<button id="',apid,'">', value, '</button>' ].join('');
}

function apText(id,value,size) {
  var apid = apId(this.id);
  value=value||'';
  size=size||'120';
  return [
    '<input type="text" name="',apid,'" id="',apid,'"',
     ' value="',value,'" size="',size,'" />'
  ].join('');
}

function apTextArea(id,value) {
  return ['<textarea id="',apId(id),'" style="width:100%">',
          value||'',
          '</textarea>\n'].join('');
}

function init() {
  if (!apInstalled) {
  console.log("before html");
    // Create the html for the flash applet container plus Plot elements
    apBodyAppend([
      '<div id=', apBoosterDivName, ' style="margin: auto;">',
        '<h3>', apBoosterTitle, '</h3>\n',
              'Style: ',
              apButton('Arc'),
              apButton('Dot'),
              apButton('Grid'),
              ' View: ',
              apButton('Natural'),
              apButton('States'),
              apButton('Dotplots'),
          '<br/>\n',
              ' Seq: ',
              apButton('Pull'),
              apButton('Push'),
              apButton('Sync'),
              ' Mark: ',
              apButton('Unmark'),
              apButton('AutoMark'),
          '<br/>\n',
        '<div id="',apId('CanvasDiv'),'">',
          '<canvas id="',apId('canvas'),'" width="600" height="600"',
            ' tabindex="1" style="border: 1px solid black;">',
        '</div>\n',
        '<br/>\n',
           '<span id="',apId('note1'),'" style="font-family: monospace;">',
           '</span>\n<br/>',
           '<span id="',apId('note2'),'" style="font-family: monospace;">',
           '</span>\n',
           '<span id="',apId('note3'),'" style="font-family: monospace;">',
           '</span><br/>\n',
           '<h4>Notes</h4>\n',
           '<p>',apTextArea('Notes'),'</p>',
           '<h4>Config</h4>\n',
           '<p>',apTextArea('Config'),'</p>',
      '</div>'].join('')
    );
    console.log('html appended')
    if (!apStub) {
      //$(function() {
      //  $(apBoosterDivSelector).accordion({
      //    collapsible: false,
      //  });
      //});
      //console.log("accordian")
      $(apBoosterDivSelector)[0].scrollIntoView(false);
      console.log("scrollIntoView")
    }
    console.log("buttons:"+apButtons.toString());
  }
  apInstalled = true;
  if (apStub) {
    byId('seq').value = "GGGUACAUCGGAGGAUAUCAUGUAAAUACAUGAGGAUCACCCAUGUCGAUGGAGACAUCGGAGGUUGAGAAGGCCGAUGUACCG";
  }
  // Get things started
  var apc = new APState();
  setTimeout( apc.activateCBs.bind(apc), 500 );
  console.log( "initializing: " + apBoosterTitle );
  apc.getState();
  apc.make_cmap();
  if (apc.dm) { apc.dm.setseq( apc.seq ); }
  else console.log('dm='+apc.dm)
  apc.setState();
}

if (!apStub) {
  init();
  //return "true";
}
