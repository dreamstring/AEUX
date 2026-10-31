// ES3-compatible strict JSON reader. Avoid large-input regular expressions/eval.
function aeuxParseJsonLinear(text) {
    var s=String(text), i=0, depth=0;
    function fail(){throw new SyntaxError('Invalid JSON at '+i);}
    function ws(){while(i<s.length && (s.charAt(i)===' '||s.charAt(i)==='\n'||s.charAt(i)==='\r'||s.charAt(i)==='\t'))i++;}
    function str(){var out=[],start=++i,c,h,n;
        while(i<s.length){c=s.charAt(i++);if(c==='"'){out.push(s.slice(start,i-1));return out.join('');}
            if(c==='\\'){out.push(s.slice(start,i-1));if(i>=s.length)fail();c=s.charAt(i++);
                if(c==='u'){h=s.substr(i,4);if(!/^[0-9a-fA-F]{4}$/.test(h))fail();n=parseInt(h,16);out.push(String.fromCharCode(n));i+=4;}
                else if(c==='"'||c==='\\'||c==='/')out.push(c);
                else if(c==='b')out.push('\b');else if(c==='f')out.push('\f');else if(c==='n')out.push('\n');else if(c==='r')out.push('\r');else if(c==='t')out.push('\t');else fail();start=i;
            }else if(c.charCodeAt(0)<32)fail();
        }fail();
    }
    function value(){ws();if(++depth>256)fail();var c=s.charAt(i),v,k,start,n;
        if(c==='"')v=str();
        else if(c==='['){i++;v=[];ws();if(s.charAt(i)===']')i++;else{while(true){v.push(value());ws();c=s.charAt(i++);if(c===']')break;if(c!==',')fail();}}}
        else if(c==='{'){i++;v={};ws();if(s.charAt(i)==='}')i++;else{while(true){ws();if(s.charAt(i)!=='"')fail();k=str();ws();if(s.charAt(i++)!==':')fail();v[k]=value();ws();c=s.charAt(i++);if(c==='}')break;if(c!==',')fail();}}}
        else if(s.substr(i,4)==='true'){i+=4;v=true;}else if(s.substr(i,5)==='false'){i+=5;v=false;}else if(s.substr(i,4)==='null'){i+=4;v=null;}
        else{start=i;if(c==='-')i++;c=s.charAt(i);if(c==='0')i++;else{if(c<'1'||c>'9')fail();while(s.charAt(i)>='0'&&s.charAt(i)<='9')i++;}
            if(s.charAt(i)==='.'){i++;n=i;while(s.charAt(i)>='0'&&s.charAt(i)<='9')i++;if(i===n)fail();}
            c=s.charAt(i);if(c==='e'||c==='E'){i++;c=s.charAt(i);if(c==='+'||c==='-')i++;n=i;while(s.charAt(i)>='0'&&s.charAt(i)<='9')i++;if(i===n)fail();}
            v=Number(s.slice(start,i));if(!isFinite(v))fail();
        }depth--;return v;
    }
    var result=value();ws();if(i!==s.length)fail();return result;
}
if(typeof module!=='undefined'&&module.exports)module.exports=aeuxParseJsonLinear;
