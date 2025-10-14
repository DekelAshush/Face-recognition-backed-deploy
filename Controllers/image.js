import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

const USER_ID = process.env.CLARIFAI_USER_ID;
const APP_ID = process.env.CLARIFAI_APP_ID;
const PAT = process.env.CLARIFAI_PAT;
const WORKFLOW_ID = process.env.CLARIFAI_WORKFLOW_ID;

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + PAT);

// Call the Clarifai API
const handleApiCall = (req, res) => {
    stub.PostWorkflowResults(
        {
            user_app_id: { user_id: USER_ID, app_id: APP_ID },
            workflow_id: WORKFLOW_ID,
            inputs: [{ data: { image: { url: req.body.input } } }],
        },
        metadata,
        (err, response) => {
            if (err) {
                console.error("Clarifai API error:", err);
                return res.status(400).json("Unable to work with API");
            }
            if (response.status.code !== 10000) {
                console.error("Clarifai API failure:", response.status);
                return res.status(400).json("Clarifai API response failed");
            }
            res.json(response);
        }
    );
};

// Update user's image entries in database
const handleImage = (req, res, db) => {
    const { id } = req.body;
    db("users")
        .where("id", "=", id)
        .increment("entries", 1)
        .returning("entries")
        .then(entries => res.json(entries[0].entries))
        .catch(() => res.status(400).json("unable to get entries"));
};

//ESM export — make sure this line exists
export { handleImage, handleApiCall };
