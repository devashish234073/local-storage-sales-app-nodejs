const http = require('http');
const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url.startsWith('/api/readdata')) {
    const query = url.parse(req.url, true).query;
    let { name } = query;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    let meds= fs.readdirSync("medicines");
    let objs=[];
    for(i in meds){
      let med = meds[i];
      if(med.toLowerCase().indexOf(name.toLowerCase())>-1){
        let fData=String(fs.readFileSync("medicines/"+med));
        let obj=JSON.parse(fData);
        objs.push(obj);
      }
    }
    
     
    if(objs.length==0){
      res.end("no results found");
    } else {
      res.end(JSON.stringify(objs));
    }

  } else if (req.method === 'POST' && req.url.startsWith('/api/sell')) {
	//const query = url.parse(req.url, true).query;
	let reqBody = '';
	req.on('data', (chunk) => {
      reqBody += chunk.toString();
    });
    req.on('end', () => {
      const formData = querystring.parse(reqBody);
      let { name, brand, price, actualprice, sale_type,qty_sold,discount,net_charged } = formData;
      const data = { name, brand, price, actualprice, sale_type,qty_sold,discount,net_charged };
      let filePrefix = String(new Date()).split(" ").join("_").split("+").join("_").split(":").join("_").split("(").join("").split(")").join("");
    
      if(name.indexOf("%20")>-1){
          name = name.split("%20").join("_");
      }
      if(name.indexOf(" ")>-1){
          name = name.split(" ").join("_");
      }

      let filename = filePrefix + name;
      fs.writeFile("sales/"+filename, JSON.stringify(data), (err) => {
	    if(err) {
	      res.end("error while saving");
        } else {
	      res.end("sales data saved successfully");
        }
	  });
    });
  } else if (req.method === 'GET' && req.url.startsWith('/api/adddata')) {
    const query = url.parse(req.url, true).query;
    let { name, brand, price, actualprice, qty, ctrId, itmPrUnit } = query;
    
    if (!name || !price) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Name and price are required.' }));
      return;
    }

    if(name.indexOf("%20")>-1){
        name = name.split("%20").join("_");
    }
    if(name.indexOf(" ")>-1){
        name = name.split(" ").join("_");
    }

    const data = { name, brand, price, actualprice, qty, ctrId, itmPrUnit };
    const filename = `medicines/${name}.json`;

    fs.writeFile(filename, JSON.stringify(data), (err) => {
      if (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error occurred while saving the data.' }));
        return;
      }

      console.log(`Data saved to ${filename}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Data saved successfully.' }));
    });
  } else if (req.method === 'GET' && req.url.startsWith('/adddata')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let addData = getPage("adddatapage.html");
    let files = fs.readdirSync("medicines");
    if(!files || files.length==0){
       addData=addData.replace("__EXISTING_FILES__","");
    } else {
      let selectTag = "<select><option value=''>--Choose--</option>";
      for(i in files){
        let file = files[i];
        selectTag+="<option value='"+file+"'>"+file.split("_").join(" ").replace(".json","")+"</option>";
      }
      selectTag+="</select>";
      addData=addData.replace("__EXISTING_FILES__",selectTag);
    }
    res.end(addData);
  } else if (req.method === 'GET' && req.url.startsWith('/bootstrap')) {
	res.end(fs.readFileSync("bootstrap.min.css"));
  } else if (req.method === 'GET' && req.url.startsWith('/sell')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let sellpage = getPage("sell.html");
    res.end(sellpage);
  } else if (req.method === 'GET' && req.url.startsWith('/salesData')) {
	res.writeHead(200, { 'Content-Type': 'text/html' });
    let allData=getPage("sales.html");
    let files = fs.readdirSync("sales");
    let table="<table class='table table-dark'>";
    table+="<tr><td>Date</td><td>Product Name</td><td>Brand</td><td>Wholesale Price</td><td>Selling Price</td><td>SALE TYPE</td><td>Qty Sold</td><td>Discount</td><td>Total Charged</td></tr>";
    for(i in files){
      let file = files[i];
      let dt = JSON.parse(fs.readFileSync("sales/"+file));
      table+=`<tr>
                  <td>${file.replace(".json","").split("_").join(" ")}</td>
                  <td>${dt.name}</td>
                  <td>${dt.brand}</td>
                  <td>${dt.actualprice}</td>
                  <td>${dt.price}</td>
                  <td>${dt.sale_type}</td>
                  <td>${dt.qty_sold}</td>
                  <td>${parseFloat(dt.discount).toFixed(2)}</td>
                  <td>${parseFloat(dt.net_charged).toFixed(2)}</td>
           </tr>`;
    }
    table+="</table>";
    allData=allData.replace("__TABLE__",table);
    res.end(allData);
  } else if (req.method === 'GET' && req.url.startsWith('/seealldata')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    let allData=getPage("seeAllData.html");
    let files = fs.readdirSync("medicines");
    let table="<table class='table table-dark'>";
    //table+="<tr><td>Medicine Name</td><td>Brand</td><td>Wholesale Price</td><td>Selling Price</td><td>Quantity</td><td>Counter Id</td></tr>";
    for(i in files){
      let file = files[i];
      let dt = JSON.parse(fs.readFileSync("medicines/"+file));
      let cls="odd";
      if(i%2==0) {
	    cls = "even";
      }
      table+=`<tr class="${cls}">
                  <td><span class="lbl">Name</span>${dt.name}</td>
                  <td><span class="lbl">Brand</span>${dt.brand}</td>
                  <td><span class="lbl">Composition</span>${dt.composition?dt.composition:""}</td>
                  <td><span class="lbl">Uses</span>${dt.uses?dt.uses:""}</td> 
             </tr>
             <tr class="${cls}">
                  <td><span class="lbl">Actual Price</span>${dt.actualprice}</td>
                  <td><span class="lbl">Price</span>${dt.price}</td>
                  <td><span class="lbl">Quantity</span>${dt.qty}</td>
                  <td><span class="lbl">Counter Id</span>${dt.ctrId}</td>
             </tr>`;
    }
    table+="</table>";
    allData=allData.replace("__TABLE__",table);
    res.end(allData);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getPage("home.html"));
  }
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

function getPage(pagename){
  return String(fs.readFileSync(pagename));
}

