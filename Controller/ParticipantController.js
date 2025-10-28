const Participant = require("../Model/ParticipantModel");
const Counter = require("../Model/CounterModel");
const Subcategory = require("../Model/SubcategoryModel");
const Category = require("../Model/CategoryModel");

const participantData = async (req, res) => {
    try {
        // console.log("Received Data:", req.body);

        const {
            fullName,
            age,
            gender,
            fatherName,
            address,
            hometown,
            whatsappNumber,
            email,
            schoolOrCollege,
            competition,
            group,
        } = req.body;

        // Check if email already exists
        const existingParticipant = await Participant.findOne({ email });
        if (existingParticipant) {
            return res.status(400).json({
                success: false,
                message: "A participant with this email already exists",
            });
        }

        //  Ensure Category exists
        let category = await Category.findOne({
            name: competition.toLowerCase(),
        });

        if (!category) {
            category = new Category({ name: competition.toLowerCase() });
            await category.save();
        }

        //  Restrict Female from Turban
        if (gender.toLowerCase() === "female" && category.name.toLowerCase() === "turban") {
            return res.status(400).json({
                success: false,
                message: "Females cannot register for the Turban category",
            });
        }

        //  Age restrictions (check before subcategory creation)
        const groupLower = group.toLowerCase();

        // For ages 5-15: not eligible for Senior and Expert
        if (age >= 5 && age <= 15 && (groupLower === "senior" || groupLower === "expert")) {
            return res.status(400).json({
                success: false,
                message: "Participants aged 5-15 are not eligible for Senior and Expert groups",
            });
        }

        // For ages 16+: not eligible for Junior
        if (age >= 15 && groupLower === "junior") {
            return res.status(400).json({
                success: false,
                message: "Participants aged 15+ are not eligible for Junior group",
            });
        }

        //  Subcategory logic - FIXED QUERY
        let subcategoryQuery;
        let subcategoryName;
        let groupName;

        if (category.name.toLowerCase() === "dumala") {
            // For dumala: group name format is "group - competition - gender"
            subcategoryName = `${group.toLowerCase()} - ${category.name} - ${gender.toLowerCase() === "female" ? "Female" : "Male"}`;
            groupName = subcategoryName;
            
            subcategoryQuery = {
                name: subcategoryName,
                categoryId: category._id
            };
        } else {
            // For other categories: just use group name
            subcategoryName = group;
            groupName = group;
            
            subcategoryQuery = {
                name: subcategoryName,
                categoryId: category._id
            };
        }

        // Find or create subcategory
        let subcategory = await Subcategory.findOne(subcategoryQuery);

        if (!subcategory) {
            subcategory = new Subcategory({
                name: subcategoryName,
                categoryId: category._id,
                group: groupName,
                ...(category.name.toLowerCase() === "dumala" && { gender: gender.toLowerCase() }),
            });

            await subcategory.save();
        }

        //  Token generation - FIXED ORDER (Letter + Number)
        const firstLetterOfCategory = category.name.charAt(0).toUpperCase();
        const firstLetterOfSubcategory = subcategory.group.charAt(0).toUpperCase();

        let counter = await Counter.findOne({
            categoryId: category._id,
            subcategoryId: subcategory._id,
        });

        if (!counter) {
            counter = new Counter({
                categoryId: category._id,
                subcategoryId: subcategory._id,
                count: 1,
            });
        } else {
            counter.count++;
        }

        // Token format: FirstLetterCategory + FirstLetterSubcategory + Count
        const participantId = counter.count + firstLetterOfCategory + firstLetterOfSubcategory ;

        const newParticipant = new Participant({
            tokenNumber: participantId,
            fullName,
            age,
            gender,
            fatherName,
            address,
            hometown,
            whatsappNumber,
            email,
            schoolOrCollege,
            competition,
            group,
            categoryId: category._id,
            subcategoryId: subcategory._id,
        });

        await newParticipant.save();
        await counter.save();

        res.status(201).json({
            success: true,
            message: "Participant registered successfully",
            participant: newParticipant,
        });
    } catch (error) {
        // console.log("Error registering participant:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

const allParticipantDetails = async (req, res) => {
    try {
        const participants = await Participant.find();
        res.status(200).json(participants);
    } catch (error) {
        // console.error("Error fetching participants:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching users",
            error: error.message,
        });
    }
};
// API to fetch participant details by ID
const participantDetailsById = async (req, res) => {
    try {
        const participant = await Participant.findById(req.params.id).populate(
            "categoryId subcategoryId"
        );
        if (!participant) {
            return res
                .status(404)
                .json({ success: false, message: "Participant not found" });
        }
        res.status(200).json(participant);
    } catch (error) {
        // console.error("Error fetching participant details:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Filter Participants
const filterParticipantsByCompetition = async (req, res) => {
    const { competition, group } = req.body;
    try {
        let query = {};
        if (competition) query.competition = competition;
        if (group) query.group = group;

        const participants = await Participant.find(query);
        res.json(participants);
    } catch (error) {
        // console.error("Error fetching participants:", error);
        res
            .status(500)
            .json({ message: "An error occurred while fetching participants." });
    }
};

module.exports = {
    participantData,
    allParticipantDetails,
    filterParticipantsByCompetition,
    participantDetailsById,
};
