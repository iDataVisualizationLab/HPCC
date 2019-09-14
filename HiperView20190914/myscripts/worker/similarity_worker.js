importScripts("../setting.js", 'similarity_calc.js');
onmessage =function ({data}){
            VARIABLES = data.variables;
            let results = [];
            let part = data.data;
            let x1, x2, source, target, similarities, similarity;
            part.forEach(sd => {
                x1 = sd.x1;
                x2 = sd.x2;
                source = x1[0][FIELD_MACHINE_ID];
                target = x2[0][FIELD_MACHINE_ID];
                similarities = {};
                VARIABLES.forEach(theVar => {
                    similarity = calculateSimilarity(x1.map(d => d[theVar]), x2.map(d => d[theVar]));
                    similarities[theVar] = similarity;
                });
                results.push({'source': source, 'target': target, 'weights': similarities});
            });
            postMessage(results);

};