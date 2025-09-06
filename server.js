var express = require("express");

var app = express();
app.use(express.json());
const fileuploader = require("express-fileupload");
app.use(fileuploader());

var mysql = require("mysql");

var dbConfiguration = {
    host: "localhost",
    user: "root",
    database: "med donation",
    password: ""
}

var DBref = mysql.createConnection(dbConfiguration);

DBref.connect(function (err) {
    if (err)
        console.log(err);
    else
        console.log("Database Server Connected");
})






const nodemailer = require("nodemailer");
const crypto = require("crypto");


const otpStore = {};


app.get("/send-otp", function (req, resp) {
  const email = req.query.email;
  const otp = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  otpStore[email] = { otp, expiresAt };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "medicinedonationonline@gmail.com",
      pass: "heec toat zlec jcwr"
    }
  });

  const mailOptions = {
    from: "medicinedonationonline@gmail.com",
    to: email,
    subject: "Your OTP for Medicine Donation",
    html: `<p>Your OTP is <b>${otp}</b>. It will expire in 5 minutes.</p>`
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      resp.send("Failed to send OTP");
    } else {
      resp.send("OTP Sent");
    }
  });
});


app.get("/verify-otp", function (req, resp) {
  const { email, otp } = req.query;
  const now = Date.now();

  if (!otpStore[email]) return resp.send("No OTP requested");

  if (otpStore[email].otp !== otp) return resp.send("Invalid OTP");
  if (now > otpStore[email].expiresAt) return resp.send("OTP Expired");

  otpStore[email].verified = true;
  resp.send("OTP Verified Successfully");
});























app.listen(2004, function () {
    console.log("Server Started");
})

app.use(express.urlencoded("extented:true"));

app.use(express.static("public"));




app.get("/", function (req, resp) {

    var path = process.cwd() + "/public/index.html";
    resp.sendFile(path);
})
/*
app.get("/savesignup", function (req, resp) {

    var email = req.query.txtSignupEmail;
    var pwd = req.query.txtSignupPwd;
    var utype = req.query.userType;

    console.log(email);
    console.log(pwd);
    console.log(utype);

    resp.send("Received");

    var dataAry = [email, pwd, utype, 1];

    DBref.query("insert into users values(?,?,?,?)", dataAry, function (err, result) {

        if (err)
            console.log(err);
        else
            console.log("Data Submited to DataBase");
    })
})

*/

app.get("/savesignup", function (req, resp) {
  const email = req.query.txtSignupEmail;
  const pwd = req.query.txtSignupPwd;
  const utype = req.query.userType;

  
  if (!otpStore[email] || !otpStore[email].verified) {
    return resp.send("Email not verified via OTP.");
  }

  const dataAry = [email, pwd, utype, 1];

  DBref.query("insert into users values(?,?,?,?)", dataAry, function (err, result) {
    if (err) {
      console.log(err);
      resp.send("Error saving user");
    } else {
      
      delete otpStore[email];
      resp.send("Signup Successful");
    }
  });
});



app.get("/checklogindetails", function (req, resp) {

    var loginEmail = req.query.txtLoginEmail;

    DBref.query("select * from users where email=?", [loginEmail], function (err, result) {

        if (err)
            resp.send(err);
        else {
            console.log(result);
            resp.send(result);
        }




    })
})






app.get("/change-password", function (req, resp) {

    var email = req.query.txtEmailsetting;
    var oldpwd = req.query.txtPwdsetting;
    var newpwd = req.query.txtNewPwdsetting;

    var dataAry = [newpwd, email];

    DBref.query("Select * from users where email=?", [email], function (err, result) {
        if (err)
            resp.send(err);
        else {
            if (result.length == 0)
                resp.send("Invalid ID");
            else
                if (result[0].pwd != oldpwd)
                    resp.send("Wrong Password");
                else {

                    DBref.query("update users set pwd=? where email=?", dataAry, function (err, result) {

                        if (err)
                            resp.send(err);
                        else {
                            resp.send("Password Updated Successfully");
                        }

                    })

                }
        }
    })


})



app.get("/profile-donor", function (req, resp) {

    var puraPath = process.cwd() + "/public/profile-donor.html";
    resp.sendFile(puraPath);
})





app.get("/profile-needy", function (req, resp) {

    var puraPath = process.cwd() + "/public/profile-needy.html";
    resp.sendFile(puraPath);
})






app.post("/submit-profile-donor", function (req, resp) {

    var email = req.body.txtEmail;
    var name = req.body.txtName;
    var contact = req.body.txtContact;
    var city = req.body.txtCity
    var addr = req.body.txtAddr;
    var timing = req.body.txtTimings;
    var prooftype = req.body.identity;

    var proofpic = req.files.fileProof.name;
    var donorpic = req.files.fileProfile.name;

    var proofName = email + proofpic;
    var desProof = process.cwd() + "/public/uploads/" + proofName;

    req.files.fileProof.mv(desProof, function (err, result) {

        if (err)
            console.log(err);
        else
            console.log("Proof Pic moved to server");
    })






    var donorName = email + donorpic;
    var desDonor = process.cwd() + "/public/uploads/" + donorName;

    req.files.fileProfile.mv(desDonor, function (err) {

        if (err)
            console.log(err);
        else
            console.log("Donor Pic moved to server");
    })

    var dataAry = [email, name, contact, city, addr, timing, prooftype, proofName, donorName];

    DBref.query("insert into dprofile values(?,?,?,?,?,?,?,?,?)", dataAry, function (err, result) {

        if (err) {
            resp.send(err);
        } else {
            resp.send("Profile Saved");
        }
    })
})





app.post("/submit-profile-needy", function (req, resp) {

    var email = req.body.txtEmail;
    var name = req.body.txtName;
    var contact = req.body.txtContact;
    var city = req.body.txtCity
    var addr = req.body.txtAddr;
    var timing = req.body.txtTimings;
    var prooftype = req.body.identity;

    var proofpic = req.files.fileProof.name;
    var donorpic = req.files.fileProfile.name;

    var proofName = email + proofpic;
    var desProof = process.cwd() + "/public/uploads/" + proofName;

    req.files.fileProof.mv(desProof, function (err, result) {

        if (err)
            console.log(err);
        else
            console.log("Proof Pic moved to server");
    })






    var needyName = email + donorpic;
    var desNeedy = process.cwd() + "/public/uploads/" + needyName;

    req.files.fileProfile.mv(desNeedy, function (err) {

        if (err)
            console.log(err);
        else
            console.log("Needy Pic moved to server");
    })

    var dataAry = [email, name, contact, city, addr, prooftype, proofName, needyName];

    DBref.query("insert into nprofile values(?,?,?,?,?,?,?,?)", dataAry, function (err, result) {

        if (err) {
            resp.send(err);
        } else {
            resp.send("Profile Saved");
        }
    })
})







app.get("/search-profile-donor", function (req, resp) {

    var email = req.query.txtEmail;

    DBref.query("Select * from dprofile where email = ?", [email], function (err, result) {

        if (err)
            resp.send(err);
        else {
            resp.send(result);
            console.log(result);
        }

    })
})



app.get("/search-profile-needy", function (req, resp) {

    var email = req.query.txtEmail;

    DBref.query("Select * from nprofile where email = ?", [email], function (err, result) {

        if (err)
            resp.send(err);
        else {
            resp.send(result);
            console.log(result);
        }

    })
})



app.post("/update-profile-donor", function (req, resp) {

    var email = req.body.txtEmail;
    var name = req.body.txtName;
    var contact = req.body.txtContact;
    var city = req.body.txtCity
    var addr = req.body.txtAddr;
    var timing = req.body.txtTimings;
    var prooftype = req.body.identity;




    if (req.files != null) {

        if (req.files.fileProof == null) {
            var proofName = req.body.hdnproof;

        } else {
            var proofName = email + req.files.fileProof.name;
            var desProof = process.cwd() + "/public/uploads/" + proofName;

            req.files.fileProof.mv(desProof, function (err, result) {

                if (err)
                    console.log(err);
                else
                    console.log("Proof Pic moved to server");
            })
        }







        if (req.files.fileProfile == null) {
            var donorName = req.body.hdnprofile;
        } else {
            var donorName = email + req.files.fileProfile.name;
            var desDonor = process.cwd() + "/public/uploads/" + donorName;

            req.files.fileProfile.mv(desDonor, function (err) {

                if (err)
                    console.log(err);
                else
                    console.log("Donor Pic moved to server");
            })
        }

    } else {
        var proofName = req.body.hdnproof;
        var donorName = req.body.hdnprofile;
    }



    var dataAry = [name, contact, city, addr, timing, prooftype, proofName, donorName, email];

    DBref.query("update dprofile set name=?, contact=?, city=?, addr=?, timing=?, prooftype=?, proofpic=?, donorpic=? where email=?", dataAry, function (err, result) {

        if (err) {
            resp.send(err);
        } else {
            resp.send("Profile Updated");
        }
    })
})








app.post("/update-profile-needy", function (req, resp) {

    var email = req.body.txtEmail;
    var name = req.body.txtName;
    var contact = req.body.txtContact;
    var city = req.body.txtCity
    var addr = req.body.txtAddr;
    // var timing = req.body.txtTimings;
    var prooftype = req.body.identity;




    if (req.files != null) {

        if (req.files.fileProof == null) {
            var proofName = req.body.hdnproof;

        } else {
            var proofName = email + req.files.fileProof.name;
            var desProof = process.cwd() + "/public/uploads/" + proofName;

            req.files.fileProof.mv(desProof, function (err, result) {

                if (err)
                    console.log(err);
                else
                    console.log("Proof Pic moved to server");
            })
        }







        if (req.files.fileProfile == null) {
            var needyName = req.body.hdnprofile;
        } else {
            var needyName = email + req.files.fileProfile.name;
            var desNeedy = process.cwd() + "/public/uploads/" + needyName;

            req.files.fileProfile.mv(desNeedy, function (err) {

                if (err)
                    console.log(err);
                else
                    console.log("Needy Pic moved to server");
            })
        }

    } else {
        var proofName = req.body.hdnproof;
        var needyName = req.body.hdnprofile;
    }



    var dataAry = [name, contact, city, addr, prooftype, proofName, needyName, email];

    DBref.query("update nprofile set name=?, contact=?, city=?, addr=?, prooftype=?, proofpic=?, needypic=? where email=?", dataAry, function (err, result) {

        if (err) {
            resp.send(err);
        } else {
            resp.send("Profile Updated");
        }
    })
})




app.get("/list-medicine", function (req, resp) {

    var path = process.cwd() + "/public/avail-medician.html";

    resp.sendFile(path);
})


app.get("/search-medicine",function(req,resp){

    var path = process.cwd()+"/public/search-medicine.html";

    resp.sendFile(path);
})




app.post("/submit-medicine", function (req, resp) {

    var email = req.body.txtEmail;
    var medicinename = req.body.txtMedName;
    var packing = req.body.txtPacking;
    var quantity = req.body.txtQuantity;
    var expiry = req.body.txtExpiryDate;
    var companyname = req.body.txtCompanyName;
    var pic = req.files.fileMedicine.name;
    var description = req.body.txtDescription;


    var medname = email + " " + pic;


    var des = process.cwd() + "/public/uploads/medicines/" + medname;
    req.files.fileMedicine.mv(des, function (err) {

        if (err)
            console.log(err);
        else
            console.log("Medicine Image Uploaded");
    })


    var dataAry = [email, medicinename, packing, quantity, expiry, companyname, medname, description];

    DBref.query("insert into medecines values(?,?,?,?,?,?,?,?)", dataAry, function (err, result) {

        if (err)
            resp.send(err);
        else {
            resp.send("Medicine Listed");
        }
    })
})







app.get("/adminpanel", function (req, resp) {

    var path = process.cwd() + "/public/admin-panel.html";

    resp.sendFile(path);
})


app.get("/block-users", function (req, resp) {

    var path = process.cwd() + "/public/block-users.html";

    resp.sendFile(path);
})


app.post("/checkAdminPwd", function (req, resp) {

    var pass = req.body.pass;

    DBref.query("select * from adminpanel where adminid=1 and pwd = ?", [pass], function (err, result) {

        if (err) {
            console.log(err);
            resp.send(err);
        }
        else {
            resp.send(result);
        }

    })
})





app.post("/fetchAllDataUsers",function(req,resp){

    DBref.query("select * from users",function(err,result){

        if(err)
            resp.send(err);
        else{
            console.log(result);
            resp.send(result);
        }
            
    })
})


app.post("/doBlockUser",function(req,resp){

    var email=req.body.email;
    
    DBref.query("update users set status=0 where email=?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
            console.log(err);
        }else{
            console.log("Updated Successfully");
            resp.send(result);
        }
    })
})


app.post("/doResumeUser",function(req,resp){

    var email=req.body.email;
    
    DBref.query("update users set status=1 where email=?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
            console.log(err);
        }else{
            console.log("Updated Successfully");
            resp.send(result);
        }
    })
})


app.get("/all-donors",function(req,resp){

    var path=process.cwd()+"/public/all-donors.html";
    resp.sendFile(path);
})




app.post("/fetchAllDataDonors",function(req,resp){

    DBref.query("select * from dprofile",function(err,result){

        if(err)
            resp.send(err);
        else{
            console.log(result);
            resp.send(result);
        }
            
    })
})




app.post("/doDeleteDonor",function(req,resp){
    
    var email=req.body.email;
    

    var deletedata="";

    DBref.query("Delete from dprofile where email = ?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
        }else
            if (result.affectedRows == 0) {
            // resp.send("Invalid Id");
            deletedata="Profile Data not Deleted ";
        } else{
            // resp.send("Deleted successfully");
            deletedata="Profile Deleted Successfully ";
        }
            
    })
    
    DBref.query("Delete from users where email = ?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
        }else
            if (result.affectedRows == 0) {
            // resp.send("Invalid Id");
            deletedata=deletedata+" User Data not Deleted";
        } else{
            // resp.send("Deleted successfully");
            deletedata=deletedata+" User Data Deleted";
        }
            
    })

    resp.send(deletedata);
})




app.get("/all-needy",function(req,resp){

    var path=process.cwd()+"/public/all-needy.html";

    resp.sendFile(path);
})


app.post("/fetchAllDataNeedy",function(req,resp){

    DBref.query("select * from nprofile",function(err,result){

        if(err)
            resp.send(err);
        else{
            console.log(result);
            resp.send(result);
        }
            
    })
})




app.post("/doDeleteNeedy",function(req,resp){
    
     var email=req.body.email;
    

    var deletedata="";

    DBref.query("Delete from nprofile where email = ?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
        }else
            if (result.affectedRows == 0) {
            // resp.send("Invalid Id");
            deletedata="Profile Data not Deleted ";
        } else{
            // resp.send("Deleted successfully");
            deletedata="Profile Deleted Successfully ";
        }
            
    })
    
    DBref.query("Delete from users where email = ?",[email],function(err,result){

        if(err)
        {
            resp.send(err);
        }else
            if (result.affectedRows == 0) {
            // resp.send("Invalid Id");
            deletedata=deletedata+" User Data not Deleted";
        } else{
            // resp.send("Deleted successfully");
            deletedata=deletedata+" User Data Deleted";
        }
            
    })

    resp.send(deletedata);
})








app.post("/fetchCities",function(req,resp){

    DBref.query("select distinct city from dprofile",function(err,result){

        if(err){
            console.log(err);
            resp.send(err);
        }
        else{
            console.log(result);
            resp.send(result);
        }
    })
})










app.post("/fetchMedicines",function(req,resp){

    var city=req.body.city;

    DBref.query("select distinct medicine from medecines inner join dprofile on medecines.emailid=dprofile.email where dprofile.city=?",[city],function(err,result){

        if(err)
            resp.send(err);
        else
        {
            resp.send(result);
            console.log(result);
        }
            
    })
})






app.post("/fetchMedicineDetails",function(req,resp){

    var city=req.body.city;
    var medicine=req.body.medicine;

    var dataAry=[city,medicine];

    DBref.query("select dprofile.* , medecines.* from dprofile join medecines on dprofile.email=medecines.emailid where dprofile.city=? and medicine=?",dataAry,function(err,result){


        if(err)
                resp.send(err);
        else{
            resp.send(result);
            console.log(result);
        }
    })
})






app.post("/displayDonorDetails",function(req,resp){

    var email=req.body.email;

    DBref.query("select * from dprofile where email = ?",[email],function(err,result){

        if(err)
            resp.send(err);
        else{
            resp.send(result);
            console.log(result);
        }
    })
})






app.get("/medicine-manager",function(req,resp){

    var path=process.cwd()+"/public/donor-med-manager.html";
    resp.sendFile(path);
})



app.post("/fetchDonorMedicineDetails",function(req,resp){

    DBref.query("select * from medecines where emailid = ?",[req.body.email],function(err,result){

        if(err)
            resp.send(err);
        else{
            resp.send(result);
            console.log(result);
        }
    })
})




app.post("/doUnlist",function(req,resp){

    DBref.query("delete from medecines where emailid = ? and medicine = ?",[req.body.email,req.body.medicine],function(err,result){

        if(err){
            resp.send(err);
        }
        else{
            resp.send("Medicine Unlisted");
        }
    })
})







app.get("/admin-med-manager",function(req,resp){

    var path=process.cwd()+"/public/admin-med-manager.html";
    resp.sendFile(path);
})